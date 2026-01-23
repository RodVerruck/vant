import json
import logging
import streamlit as st
import re
import concurrent.futures
from google import genai
from google.genai import types
from groq import Groq
from io import BytesIO

# ============================================================
# LOGGING & CONFIG
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("VANT_CORE")

GOOGLE_API_KEY = st.secrets.get("GOOGLE_API_KEY")
GROQ_API_KEY = st.secrets.get("GROQ_API_KEY")

if GOOGLE_API_KEY:
    genai_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    genai_client = None
    logger.error("❌ GOOGLE_API_KEY não configurada")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ============================================================
# AGENT → MODEL REGISTRY
# ============================================================
AGENT_MODEL_REGISTRY = {
    "diagnosis": "gemini-2.0-flash",

    # Escrita de CV - Mantendo o 2.5 mas com fallback de código
    "cv_writer_semantic": "gemini-2.5-flash", 
    "cv_formatter": "gemini-2.0-flash",

    # Estratégia
    "tactical": "gemini-2.0-flash",
    "library": "gemini-2.0-flash",

    # Inteligência
    "competitor_analysis": "gemini-2.0-flash",
    "interview_evaluator": "gemini-2.0-flash",
}

DEFAULT_MODEL = "gemini-2.0-flash"

# ============================================================
# IMPORT PROMPTS
# ============================================================
try:
    from prompts import (
        SYSTEM_AGENT_DIAGNOSIS,
        SYSTEM_AGENT_CV_WRITER_SEMANTIC,
        SYSTEM_AGENT_CV_FORMATTER,
        SYSTEM_AGENT_COMBO_TACTICAL,
        SYSTEM_AGENT_LIBRARY_CURATOR,
        SYSTEM_AGENT_COMPETITOR_ANALYSIS,
        SYSTEM_AGENT_INTERVIEW_EVALUATOR,
    )
except ImportError as e:
    logger.critical(f"❌ Erro ao importar prompts: {e}")
    raise e

# ============================================================
# JSON CLEANER (REFORÇADO)
# ============================================================
def clean_json_string(text: str) -> str:
    """Limpa a string de retorno da LLM para garantir JSON válido."""
    if not text:
        return "{}"

    # Remove blocos de código Markdown ```json ... ```
    text = re.sub(r"```(?:json)?", "", text)
    text = re.sub(r"```", "", text)
    
    # Encontra o primeiro { e o último }
    start = text.find("{")
    end = text.rfind("}")
    
    if start == -1 or end == -1:
        # Se não achar JSON, retorna a string original limpa para o Fallback tentar salvar
        return text.strip()

    text = text[start:end + 1]
    # Remove caracteres de controle invisíveis que quebram json.loads
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)
    return text.strip()

# ============================================================
# CORE LLM CALL (COM FALLBACK DE RESILIÊNCIA)
# ============================================================
@st.cache_data(ttl=86400, show_spinner=False)
def _call_google_cached(
    system_prompt: str,
    user_content: str,
    agent_name: str,
    model_name: str,
):
    if not genai_client:
        logger.error("❌ genai_client indisponível")
        return None

    try:
        # Prompt unificado forçando JSON
        prompt = f"""
INSTRUÇÃO DO SISTEMA:
{system_prompt}

DADOS DO USUÁRIO:
{user_content}

SAÍDA OBRIGATÓRIA:
Apenas JSON válido.
"""

        response = genai_client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=8192,
            ),
        )

        cleaned_text = clean_json_string(response.text)

        # TENTATIVA 1: Parse normal
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            # TENTATIVA 2 (FALLBACK): O texto existe, mas o JSON quebrou.
            # Em vez de retornar None, retornamos o texto bruto empacotado.
            logger.warning(f"⚠️ JSON quebrado em [{agent_name}]. Usando Fallback de Texto Bruto.")
            
            # Criamos um dicionário "coringa" que serve para qualquer agente
            return {
                "texto_reescrito": response.text,      # Para Agente 2A
                "cv_otimizado_texto": response.text,   # Para Agente 2B
                "veredito": "Análise Realizada (Texto Bruto)", # Para Diagnosis
                "gaps_fatais": [],
                "biblioteca_tecnica": [],
                "perguntas_entrevista": []
            }

    except Exception as e:
        logger.error(f"❌ Erro Fatal LLM [{agent_name} | {model_name}]: {e}")
        return None


def call_llm(system_prompt: str, payload: str, agent_name: str):
    model = AGENT_MODEL_REGISTRY.get(agent_name, DEFAULT_MODEL)
    return _call_google_cached(system_prompt, payload, agent_name, model)

# ============================================================
# PIPELINE CV (CORE PRODUCT)
# ============================================================
def run_cv_pipeline(cv_text: str, strategy_payload: dict):
    logger.info("🧠 Pipeline CV iniciado")

    # 1. Agente Escritor (Semântico)
    semantic_cv = call_llm(
        SYSTEM_AGENT_CV_WRITER_SEMANTIC,
        json.dumps(strategy_payload, ensure_ascii=False),
        "cv_writer_semantic",
    )

    # Se falhou totalmente (erro de API), aborta
    if not semantic_cv:
        return {"cv_otimizado_completo": "Erro na conexão com a IA (Escrita). Tente novamente."}

    # Se veio do fallback, semantic_cv['texto_reescrito'] conterá o texto bruto (markdown)
    # Isso permite que o processo continue!

    # 2. Agente Formatador (Visual)
    formatted_cv = call_llm(
        SYSTEM_AGENT_CV_FORMATTER,
        json.dumps(semantic_cv, ensure_ascii=False),
        "cv_formatter",
    )

    if not formatted_cv:
        # Se o formatador falhar, tentamos entregar o texto semântico cru como backup
        logger.warning("⚠️ Formatador falhou. Entregando texto semântico bruto.")
        raw_text = semantic_cv.get("texto_reescrito", "")
        if raw_text:
            return {"cv_otimizado_completo": raw_text}
        return {"cv_otimizado_completo": "Erro na formatação final do CV."}

    # Busca a chave correta (seja do JSON limpo ou do fallback)
    final_text = formatted_cv.get("cv_otimizado_texto") or formatted_cv.get("texto_reescrito")
    
    if not final_text:
        return {"cv_otimizado_completo": "Erro: Conteúdo vazio gerado pela IA."}

    return {"cv_otimizado_completo": final_text}

# ============================================================
# AGENTES AUXILIARES (COM PROTEÇÃO CONTRA NONE)
# ============================================================
def agent_diagnosis(cv, job):
    res = call_llm(
        SYSTEM_AGENT_DIAGNOSIS,
        f"VAGA: {job}\nCV: {cv}",
        "diagnosis",
    )
    return res if res else {"veredito": "Indisponível", "gaps_fatais": []}


def agent_tactical(job, gaps):
    res = call_llm(
        SYSTEM_AGENT_COMBO_TACTICAL,
        json.dumps({"vaga": job, "gaps": gaps}, ensure_ascii=False),
        "tactical",
    )
    return res if res else {"perguntas_entrevista": [], "kit_hacker": {}}


def agent_library(job, gaps, catalog):
    res = call_llm(
        SYSTEM_AGENT_LIBRARY_CURATOR,
        json.dumps({"vaga": job, "gaps": gaps, "catalogo": catalog}, ensure_ascii=False),
        "library",
    )
    return res if res else {"biblioteca_tecnica": []}


def agent_competitor_analysis(cv, job, competitors):
    if not competitors:
        return {}
    res = call_llm(
        SYSTEM_AGENT_COMPETITOR_ANALYSIS,
        f"VAGA: {job}\nCV: {cv}\nCONCORRENTES:\n{competitors}",
        "competitor_analysis",
    )
    return res if res else {}

# ============================================================
# ORQUESTRADOR FINAL
# ============================================================
def run_llm_orchestrator(
    cv_text,
    job_description,
    books_catalog,
    area,
    competitors_text=None,
):
    logger.info(f"🚀 Iniciando VANT | Área: {area}")

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_diag = executor.submit(agent_diagnosis, cv_text, job_description)

        future_comp = (
            executor.submit(
                agent_competitor_analysis,
                cv_text,
                job_description,
                competitors_text,
            )
            if competitors_text
            else None
        )

        diag_result = future_diag.result()
        gaps = diag_result.get("gaps_fatais", [])

        strategy_payload = {
            "cv_original": cv_text,
            "diagnostico": diag_result,
            "vaga": job_description,
        }

        # Executa o pipeline de CV
        cv_result = run_cv_pipeline(cv_text, strategy_payload)

        future_tactical = executor.submit(agent_tactical, job_description, gaps)
        future_library = executor.submit(agent_library, job_description, gaps, books_catalog)

        result = {
            **diag_result,
            **cv_result,
            **future_tactical.result(),
            **future_library.result(),
        }

        if future_comp:
            result.update(future_comp.result())

    logger.info("🏁 Orquestração concluída")
    return result

# ============================================================
# FUNÇÕES DE ÁUDIO E ENTREVISTA (NOVO)
# ============================================================

def transcribe_audio_groq(audio_bytes):
    """
    Transcreve áudio usando Groq (Whisper-Large-V3).
    Rápido e barato.
    """
    if not groq_client:
        logger.error("❌ Groq Client não configurado.")
        return "Erro: API Groq indisponível."

    try:
        # Cria um arquivo em memória com nome (necessário para a API)
        audio_file = BytesIO(audio_bytes)
        audio_file.name = "audio.webm"  # Streamlit grava em webm/wav
        
        # Chamada à API Groq
        transcription = groq_client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3",
            response_format="text",
            temperature=0.0
        )
        return transcription

    except Exception as e:
        logger.error(f"❌ Erro na transcrição Groq: {e}")
        return f"Erro ao transcrever áudio: {str(e)}"


def analyze_interview_gemini(pergunta, resposta_texto, contexto_vaga):
    """
    Analisa a resposta do candidato usando a persona de Tech Lead.
    """
    if not resposta_texto or len(resposta_texto) < 5:
        return {
            "nota_final": 0,
            "feedback_curto": "Áudio inaudível ou muito curto.",
            "pontos_melhoria": ["Tente falar mais próximo ao microfone."],
            "analise_fina": {}
        }

    payload = f"""
    CONTEXTO DA VAGA:
    {contexto_vaga}

    PERGUNTA FEITA PELO ENTREVISTADOR:
    "{pergunta}"

    RESPOSTA TRANSCRITA DO CANDIDATO:
    "{resposta_texto}"
    """

    # Reutiliza a infraestrutura robusta do call_llm
    return call_llm(
        system_prompt=SYSTEM_AGENT_INTERVIEW_EVALUATOR,
        payload=payload,
        agent_name="interview_evaluator"
    )