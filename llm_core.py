import json
import logging
import streamlit as st
from google import genai
from google.genai import types
import re
import concurrent.futures # <--- MÓDULO DE PARALELISMO
from groq import Groq
from prompts import SYSTEM_AGENT_INTERVIEW_EVALUATOR

# ============================================================
# LOGGING & CONFIG
# ============================================================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VANT_GEMINI_2.0")

GOOGLE_API_KEY = st.secrets.get("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    logger.error("❌ GOOGLE_API_KEY não encontrada! Configure no secrets.toml")
    client = None
else:
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
    except Exception as e:
        logger.error(f"Erro ao iniciar cliente Google: {e}")
        client = None
        
# Configuração Groq
GROQ_API_KEY = st.secrets.get("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None
    logger.warning("⚠️ GROQ_API_KEY não encontrada!")

# ============================================================
# IMPORT PROMPTS
# ============================================================
try:
    from prompts import (
        SYSTEM_AGENT_DIAGNOSIS,
        SYSTEM_AGENT_COMBO_TACTICAL,
        SYSTEM_AGENT_LIBRARY_CURATOR,
        SYSTEM_AGENT_CV_WRITER,
        SYSTEM_AGENT_COMPETITOR_ANALYSIS 
    )
except ImportError:
    # Fallback seguro
    SYSTEM_AGENT_DIAGNOSIS = "Erro"
    SYSTEM_AGENT_CV_WRITER = "Erro"
    SYSTEM_AGENT_COMBO_TACTICAL = "Erro"
    SYSTEM_AGENT_LIBRARY_CURATOR = "Erro"
    SYSTEM_AGENT_COMPETITOR_ANALYSIS = "Erro"

# ============================================================
# HELPER: JSON CLEANER
# ============================================================
def clean_json_string(text: str) -> str:
    try:
        if "```" in text:
            pattern = r"```(?:json)?\s*(.*?)\s*```"
            match = re.search(pattern, text, re.DOTALL)
            if match: text = match.group(1)
        
        start = text.find("{")
        end = text.rfind("}")
        
        if start != -1 and end != -1:
            text = text[start : end + 1]
        else:
            return "{}"

        text = text.strip()
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        return text
    except Exception as e:
        logger.error(f"Erro crítico limpando JSON: {e}")
        return "{}"

# ============================================================
# CORE: CHAMADA GOOGLE (COM CACHE PERSISTENTE STREAMLIT)
# ============================================================

# [TECH LEAD MAGIC] - Cache nativo do Streamlit (TTL 24h)
# Substitui toda a lógica antiga de _make_cache_key e _LLM_CACHE
@st.cache_data(ttl=3600*24, show_spinner=False)
def _call_google_cached(system_prompt, user_content, agent_name):
    """
    Função interna pura para cachear a resposta. 
    Recria o cliente aqui dentro para evitar erros de thread/pickle do Streamlit.
    """
    if not GOOGLE_API_KEY: return None
    
    # Instância local segura para cache
    local_client = genai.Client(api_key=GOOGLE_API_KEY)

    try:
        combined_prompt = f"""
        INSTRUÇÃO DO SISTEMA:
        {system_prompt}

        DADOS DO USUÁRIO:
        {user_content}

        SAÍDA OBRIGATÓRIA:
        Responda APENAS com um JSON válido.
        """

        model_id = 'gemini-2.0-flash' 

        response = local_client.models.generate_content(
            model=model_id,
            contents=combined_prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                temperature=0.2, 
                max_output_tokens=8192,
            )
        )
        
        # Limpa e converte para JSON antes de salvar no cache
        return json.loads(clean_json_string(response.text))

    except Exception as e:
        # Retorna None para não cachear erros
        return None

# -----------------------------------------------------------
# NOVA FUNÇÃO 1: TRANSCRIÇÃO (AUDIO -> TEXTO via GROQ)
# -----------------------------------------------------------
def transcribe_audio_groq(audio_bytes):
    """
    Envia bytes de áudio para a Groq (Whisper-large-v3).
    Retorna: String (Texto transcrito)
    """
    if not groq_client:
        return "Erro: API Groq não configurada."
    
    try:
        # A Groq espera um arquivo tupla ('nome.ext', bytes)
        # O Streamlit envia bytes, damos um nome fake para o Whisper saber o formato.
        transcription = groq_client.audio.transcriptions.create(
            file=("input_audio.m4a", audio_bytes), 
            model="whisper-large-v3",
            response_format="text",
            language="pt" # Força português para evitar alucinação em silêncio
        )
        return transcription
    except Exception as e:
        logger.error(f"Erro na Groq: {e}")
        return f"Erro na transcrição: {str(e)}"

# -----------------------------------------------------------
# NOVA FUNÇÃO 2: ANÁLISE DE ENTREVISTA (TEXTO -> JSON via GEMINI)
# -----------------------------------------------------------
def analyze_interview_gemini(question, answer_text, job_description=""):
    """
    Analisa a resposta usando o Gemini, considerando o contexto da vaga se disponível.
    """
    if not answer_text or len(answer_text) < 5:
        return None

    # Monta o conteúdo do usuário com contexto extra
    user_content = f"""
    CONTEXTO DA VAGA:
    {job_description[:2000]} (Resumo)

    PERGUNTA DA ENTREVISTA:
    {question}

    RESPOSTA TRANSCRITA DO CANDIDATO:
    {answer_text}
    """
    
    # Chama o Gemini com o novo System Prompt dedicado
    return call_google_flash(SYSTEM_AGENT_INTERVIEW_EVALUATOR, user_content, "interview_evaluator")

def call_google_flash(system_prompt, user_content, agent_name="generic"):
    """
    Wrapper para gerenciar logs e chamar a função cacheada.
    """
    # Chama a função decorada com cache
    result = _call_google_cached(system_prompt, user_content, agent_name)
    
    if result:
        # Se retornou, é sucesso (seja do cache ou da API nova)
        # logger.info(f"✅ Sucesso (ou Cache Hit): {agent_name}") 
        return result
    else:
        logger.error(f"❌ Falha no LLM ou Miss Crítico: {agent_name}")
        return None

# ============================================================
# AGENTES (FUNÇÕES WRAPPERS)
# ============================================================

def agent_diagnosis(cv, job):
    res = call_google_flash(SYSTEM_AGENT_DIAGNOSIS, f"VAGA: {job}\nCV: {cv}", "diagnosis")
    return res if res else {"veredito": "Erro", "gaps_fatais": []}

def agent_cv_writer(cv, job):
    res = call_google_flash(SYSTEM_AGENT_CV_WRITER, f"VAGA: {job}\nCV ORIGINAL: {cv}", "writer")
    return {"cv_otimizado_completo": res.get("cv_otimizado_texto", "")} if res else {"cv_otimizado_completo": "Erro na reescrita."}

def agent_tactical(job, gaps):
    gaps_text = json.dumps([g.get("erro") for g in gaps])
    res = call_google_flash(SYSTEM_AGENT_COMBO_TACTICAL, f"VAGA: {job}\nGAPS: {gaps_text}", "tactical")
    return res if res else {"perguntas_entrevista": [], "roadmap_semanal": [], "kit_hacker": {}}

def agent_lib(job, gaps, catalog):
    gaps_text = json.dumps([g.get("erro") for g in gaps])
    res = call_google_flash(SYSTEM_AGENT_LIBRARY_CURATOR, f"VAGA: {job}\nGAPS: {gaps_text}\nCATALOGO: {json.dumps(catalog)}", "library")
    return res if res else {"biblioteca_tecnica": []}

def agent_competitor_analysis(user_cv, job, competitors_text):
    if not competitors_text:
        return {"analise_comparativa": None}
    
    res = call_google_flash(
        SYSTEM_AGENT_COMPETITOR_ANALYSIS, 
        f"VAGA: {job}\n\nMEU CV (CANDIDATO): {user_cv}\n\nCVs CONCORRENTES/BENCHMARKS:\n{competitors_text}", 
        "competitor_analysis"
    )
    return res if res else {"analise_comparativa": None}

# ============================================================
# ORQUESTRADOR PARALELO (TURBO MODE - SEQUENCIAL/HÍBRIDO)
# ============================================================

def run_llm_orchestrator(cv_text, job_description, books_catalog, area, competitors_text=None):
    logger.info(f"🚀 Iniciando VANT (Gemini 2.0 Flash) | Area: {area} | MODO: PARALELO")
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # ------------------------------------------------------------------
        # ONDA 1: INDEPENDENTES (Rodam todos juntos agora)
        # ------------------------------------------------------------------
        logger.info("⚡ Disparando Onda 1: Diagnóstico, CV Writer e Concorrência...")
        
        # Inicia tasks
        future_diag = executor.submit(agent_diagnosis, cv_text, job_description)
        future_cv = executor.submit(agent_cv_writer, cv_text, job_description)
        
        future_comp = None
        if competitors_text:
            future_comp = executor.submit(agent_competitor_analysis, cv_text, job_description, competitors_text)
        
        # ------------------------------------------------------------------
        # CHECKPOINT (Esperamos o Diagnóstico pois os outros dependem dele)
        # ------------------------------------------------------------------
        data_diag = future_diag.result() # Bloqueia aqui até Diagnóstico terminar
        gaps = data_diag.get("gaps_fatais", [])
        logger.info("✅ Diagnóstico concluído. Gaps identificados.")

        # ------------------------------------------------------------------
        # ONDA 2: DEPENDENTES (Rodam juntos assim que temos os Gaps)
        # ------------------------------------------------------------------
        logger.info("⚡ Disparando Onda 2: Tático e Biblioteca...")
        
        future_tactical = executor.submit(agent_tactical, job_description, gaps)
        future_lib = executor.submit(agent_lib, job_description, gaps, books_catalog)
        
        # ------------------------------------------------------------------
        # COLETA FINAL (Esperamos todos terminarem)
        # ------------------------------------------------------------------
        data_cv = future_cv.result()
        data_tactical = future_tactical.result()
        data_lib = future_lib.result()
        
        data_competitor = {}
        if future_comp:
            data_competitor = future_comp.result()

    logger.info("🏁 Orquestração Paralela Finalizada com Sucesso.")

    # Fusão dos resultados
    return {**data_diag, **data_cv, **data_tactical, **data_lib, **data_competitor}