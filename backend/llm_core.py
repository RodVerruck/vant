import json
import logging
import os
import re
import concurrent.futures
import time
from google import genai
from google.genai import types
from groq import Groq
from backend.cache_manager import CacheManager

# ============================================================
# LOGGING & CONFIG
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("VANT_CORE")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GOOGLE_API_KEY:
    genai_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    genai_client = None

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def _vant_error(message: str, agent_name=None, model_name=None):
    payload = {
        "_vant_error": True,
        "message": message,
    }
    if agent_name:
        payload["agent"] = agent_name
    if model_name:
        payload["model"] = model_name
    return payload

# ============================================================
# AGENT → MODEL REGISTRY (ATUALIZADO FEV/2026)
# ============================================================
AGENT_MODEL_REGISTRY = {
    # ESCRITOR DE CV (Critical Path):
    # Gemini 3.0 Flash Preview - thinking nativo para +30% performance
    "cv_writer_semantic": "models/gemini-3-flash-preview", 

    # TAREFAS RÁPIDAS (Velocidade/Custo):
    # Migrado de 2.0 para 2.5 Flash (O 2.0 morre em março/26)
    "diagnosis": "models/gemini-2.5-flash", 
    "cv_formatter": "models/gemini-2.5-flash",
    "tactical": "models/gemini-2.5-flash",
    "library": "models/gemini-2.5-flash",
    
    # INTELIGENCE:
    "competitor_analysis": "models/gemini-2.5-flash",
    "interview_evaluator": "models/gemini-2.5-flash",
}

DEFAULT_MODEL = "models/gemini-2.5-flash"

# ============================================================
# IMPORT PROMPTS
# ============================================================
try:
    from backend.prompts import (
        SYSTEM_AGENT_DIAGNOSIS,
        SYSTEM_AGENT_CV_WRITER_SEMANTIC,
        SYSTEM_AGENT_CV_FORMATTER,
        SYSTEM_AGENT_COMBO_TACTICAL,
        SYSTEM_AGENT_LIBRARY_CURATOR,
        SYSTEM_AGENT_COMPETITOR_ANALYSIS,
        SYSTEM_AGENT_INTERVIEW_EVALUATOR,
    )
except ImportError:
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
def _call_google_cached(
    system_prompt: str,
    user_content: str,
    agent_name: str,
    model_name: str,
):
    global genai_client
    if not genai_client:
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            try:
                genai_client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.error(f"❌ Falha ao inicializar genai_client: {e}")
                return _vant_error(
                    f"Falha ao inicializar cliente Google GenAI. Verifique GOOGLE_API_KEY e a versão do pacote google-genai. Detalhe: {type(e).__name__}: {e}",
                    agent_name=agent_name,
                    model_name=model_name,
                )
        else:
            logger.error("❌ genai_client indisponível (GOOGLE_API_KEY ausente)")
            return _vant_error(
                "GOOGLE_API_KEY não configurada. Defina a variável de ambiente GOOGLE_API_KEY.",
                agent_name=agent_name,
                model_name=model_name,
            )

    def _generate(model_to_use: str):
        # Prompt unificado forçando JSON
        prompt = f"""
INSTRUÇÃO DO SISTEMA:
{system_prompt}

DADOS DO USUÁRIO:
{user_content}

SAÍDA OBRIGATÓRIA:
Apenas JSON válido.
"""

        # Configuração Dinâmica para Gemini 3.0
        # O modelo 3.0 Flash permite definir o nível de raciocínio.
        is_writer = agent_name == "cv_writer_semantic"
        
        # Parâmetros de configuração (Atualizado SDK v2026)
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.4 if is_writer else 0.2,
            "max_output_tokens": 15000 if is_writer else 8192,
        }

        # [TRUQUE] Forçar "High Reasoning" apenas para o CV Writer no Gemini 3
        # thinking_level foi removido da API - usando apenas temperatura mais alta
        if is_writer and "gemini-3" in model_to_use:
            # Aumentamos um pouco a temperatura para simular "thinking"
            generation_config["temperature"] = 0.6 

        response = genai_client.models.generate_content(
            model=model_to_use,
            contents=prompt,
            config=types.GenerateContentConfig(**generation_config),
        )

        cleaned_text = clean_json_string(response.text)

        # TENTATIVA 1: Parse normal
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            # TENTATIVA 2: Tentativa de reparo JSON
            logger.warning(f"⚠️ JSON quebrado em [{agent_name}]. Tentando reparo automático...")
            try:
                # Tentar corrigir problemas comuns de JSON
                repaired_text = cleaned_text
                
                # Corrigir aspas não escapadas em valores
                repaired_text = re.sub(r'(?<!\\)"(?=[^,:}\s])', r'\\"', repaired_text)
                
                # Tentar parse novamente
                return json.loads(repaired_text)
            except:
                # TENTATIVA 3 (FALLBACK): O texto existe, mas o JSON quebrou.
                logger.warning(f"⚠️ JSON irrecuperável em [{agent_name}]. Usando Fallback de Texto Bruto.")
                
                # Para cv_formatter, tentar extrair o texto do markdown
                if agent_name == "cv_formatter":
                    # Remover marcadores markdown mas manter estrutura
                    text_content = re.sub(r'```(?:json)?', '', response.text)
                    text_content = re.sub(r'```', '', text_content)
                    
                    # Tentar encontrar cv_otimizado_texto no texto bruto
                    if "cv_otimizado_texto" in text_content:
                        # Extrair apenas o conteúdo do campo
                        match = re.search(r'"cv_otimizado_texto"\s*:\s*"([^"]*(?:\\"[^"]*)*)"', text_content)
                        if match:
                            content = match.group(1).replace('\\"', '"').replace('\\n', '\n')
                            return {"cv_otimizado_texto": content}
                
                return {
                    "texto_reescrito": response.text,
                    "cv_otimizado_texto": response.text,
                    "veredito": "Análise Realizada (Texto Bruto)",
                    "gaps_fatais": [],
                    "biblioteca_tecnica": [],
                    "perguntas_entrevista": []
                }

    try:
        return _generate(model_name)

    except Exception as e:
        msg = str(e).lower()
        if model_name != DEFAULT_MODEL and ("not found" in msg or "404" in msg or "permission" in msg or "403" in msg):
            logger.warning(f"⚠️ Modelo [{model_name}] indisponível/sem permissão. Tentando fallback [{DEFAULT_MODEL}]...")
            try:
                return _generate(DEFAULT_MODEL)
            except Exception as e2:
                logger.error(f"❌ Fallback de modelo também falhou [{agent_name} | {DEFAULT_MODEL}]: {e2}")
                return _vant_error(
                    f"Falha ao chamar o modelo ({agent_name}). Modelo [{model_name}] não disponível e fallback falhou. Detalhe: {type(e2).__name__}: {e2}",
                    agent_name=agent_name,
                    model_name=DEFAULT_MODEL,
                )

        logger.error(f"❌ Erro Fatal LLM [{agent_name} | {model_name}]: {e}")
        return _vant_error(
            f"Falha ao chamar o modelo ({agent_name}). Verifique GOOGLE_API_KEY e a versão do pacote google-genai. Detalhe: {type(e).__name__}: {e}",
            agent_name=agent_name,
            model_name=model_name,
        )

def call_llm(system_prompt: str, payload: str, agent_name: str):
    api_key = os.getenv("GOOGLE_API_KEY")
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

    # Se falhou totalmente (erro de API / secrets / SDK), aborta com diagnóstico
    if not semantic_cv:
        return {"cv_otimizado_completo": "Erro na conexão com a IA (Escrita)."}
    if isinstance(semantic_cv, dict) and semantic_cv.get("_vant_error"):
        return {"cv_otimizado_completo": semantic_cv.get("message", "Erro na conexão com a IA (Escrita).")}

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
# ORQUESTRADOR FINAL COM CACHE INTELIGENTE
# ============================================================
def run_llm_orchestrator(
    cv_text,
    job_description,
    books_catalog,
    area,
    competitors_text=None,
    user_id=None,
):
    logger.info(f"🚀 Iniciando VANT | Área: {area}")
    
    # Inicializa o cache manager
    cache_manager = CacheManager()
    
    # NÍVEL 1: Cache de Hash (Deduplicação Imediata)
    # Gera hash dos dados de entrada para verificar se já foi processado
    input_hash = cache_manager.generate_input_hash(cv_text, job_description)
    
    # Verifica se resultado já existe no cache
    cached_result = cache_manager.check_cache(input_hash)
    if cached_result:
        logger.info(f"⚡ CACHE HIT! Retornando resultado processado anteriormente")
        return cached_result
    
    logger.info(f"🔄 CACHE MISS: Processando com IA...")
    logger.info("⚡ PARALELIZAÇÃO MÁXIMA: 4 threads independentes")
    
    # Cache miss - processa normalmente com IA
    # PARALELIZAÇÃO MÁXIMA: 4 threads independentes
    
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        # Thread 1: Diagnosis (rápido, libera outros agentes)
        future_diag = executor.submit(agent_diagnosis, cv_text, job_description)
        
        # Thread 2: Competitor Analysis (100% independente, roda desde início)
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
        
        # Espera apenas o Diagnosis para liberar os dependentes
        diag_result = future_diag.result()
        gaps = diag_result.get("gaps_fatais", [])

        # Thread 3: CV Pipeline (crítico, depende do Diagnosis)
        strategy_payload = {
            "cv_original": cv_text,
            "diagnostico": diag_result,
            "vaga": job_description,
        }
        future_cv = executor.submit(run_cv_pipeline, cv_text, strategy_payload)
        
        # Threads 4 e 5: Tactical e Library (paralelos, dependem só do Diagnosis)
        future_tactical = executor.submit(agent_tactical, job_description, gaps)
        future_library = executor.submit(agent_library, job_description, gaps, books_catalog)

        # Coleta resultados das threads que podem rodar em paralelo
        cv_result = future_cv.result()
        tactical_result = future_tactical.result()
        library_result = future_library.result()
        
        # DEBUG: Log dos resultados
        logger.info(f"[DEBUG] Tactical result keys: {list(tactical_result.keys()) if tactical_result else 'None'}")
        logger.info(f"[DEBUG] Library result keys: {list(library_result.keys()) if library_result else 'None'}")
        logger.info(f"[DEBUG] Diag result keys: {list(diag_result.keys()) if diag_result else 'None'}")
        
        # Merge explícito para garantir que todos os campos sejam preservados
        result = {}
        
        # Adicionar diagnóstico
        if diag_result:
            result.update(diag_result)
            logger.info(f"[DEBUG] Added diag_result: {list(diag_result.keys())}")
        
        # Adicionar CV otimizado
        if cv_result:
            result.update(cv_result)
            logger.info(f"[DEBUG] Added cv_result: {list(cv_result.keys())}")
        
        # Adicionar tático (ação)
        if tactical_result:
            result.update(tactical_result)
            logger.info(f"[DEBUG] Added tactical_result: {list(tactical_result.keys())}")
        
        # Adicionar biblioteca
        if library_result:
            result.update(library_result)
            logger.info(f"[DEBUG] Added library_result: {list(library_result.keys())}")
        
        # Garantir campos mínimos
        if "perguntas_entrevista" not in result:
            result["perguntas_entrevista"] = []
        if "biblioteca_tecnica" not in result:
            result["biblioteca_tecnica"] = []
        if "projeto_pratico" not in result:
            result["projeto_pratico"] = {}
        if "kit_hacker" not in result:
            result["kit_hacker"] = {}

        if future_comp:
            comp_result = future_comp.result()
            logger.info(f"[DEBUG] Competitor result keys: {list(comp_result.keys()) if comp_result else 'None'}")
            result.update(comp_result)
        
    # NÍVEL 2: Persistência de Sessão (Histórico)
    # Salva o resultado no cache para futuras consultas
    if user_id and result:
        cache_saved = cache_manager.save_to_cache(
            input_hash=input_hash,
            user_id=user_id,
            cv_text=cv_text,
            job_description=job_description,
            result_json=result
        )
        if cache_saved:
            logger.info(f"💾 Resultado salvo no cache para usuário {user_id}")
    
    logger.info("🏁 Orquestração concluída")
    total_time = time.time() - start_time
    logger.info(f"⚡ TEMPO TOTAL: {total_time:.1f}s (PARALELIZAÇÃO MÁXIMA)")
    logger.info(f"[DEBUG] Final result keys: {list(result.keys())}")
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
        audio_file.name = "audio.webm"
        
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