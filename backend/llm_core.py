import json
import logging
import os
import re
import concurrent.futures
import time
from google import genai
from google.genai import types
from groq import Groq
from anthropic import Anthropic
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
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if GOOGLE_API_KEY:
    genai_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    genai_client = None

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
claude_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

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
    # Gemini 2.5 Flash - estável, bom custo-benefício
    "cv_writer_semantic": "models/gemini-2.5-flash", 

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
# JSON CLEANER (SIMPLIFICADO E SEGURO)
# ============================================================
def clean_json_string(text: str) -> str:
    """Limpeza segura da string de retorno da LLM para JSON."""
    if not text:
        return "{}"
    
    # Remove blocos de código Markdown ```json ... ```
    text = re.sub(r"```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*$", "", text)
    
    return text.strip()

# ============================================================
# CORE LLM CALL (PARSER V4 - BLINDADO)
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
                    f"Falha ao inicializar cliente Google GenAI. Verifique GOOGLE_API_KEY. Detalhe: {type(e).__name__}: {e}",
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
        # SEPARAÇÃO CLARA: CV Writers vs JSON Agents
        is_cv_agent = agent_name in ["cv_writer_semantic", "cv_formatter"]
        
        if is_cv_agent:
            # Protocolo Texto para CV Writers
            prompt = f"""
INSTRUÇÃO DO SISTEMA:
{system_prompt}

DADOS DO USUÁRIO:
{user_content}

SAÍDA: Apenas o texto do currículo formatado em Markdown. Não use blocos de código, não use JSON.
"""
            
            generation_config = {
                "response_mime_type": "text/plain",
                "temperature": 0.4,
                "max_output_tokens": 15000,
            }
        else:
            # Protocolo JSON para outros agentes
            prompt = f"""
INSTRUÇÃO DO SISTEMA:
{system_prompt}

DADOS DO USUÁRIO:
{user_content}

SAÍDA OBRIGATÓRIA: Apenas JSON válido.
"""
            
            generation_config = {
                "response_mime_type": "application/json",
                "temperature": 0.2,
                "max_output_tokens": 8192,
            }

        # Configuração Dinâmica para Gemini 3.0
        is_writer = agent_name == "cv_writer_semantic"
        if not is_cv_agent and is_writer:
            generation_config["temperature"] = 0.4
            generation_config["max_output_tokens"] = 15000

        if is_writer and "gemini-3" in model_to_use:
            generation_config["temperature"] = 0.6 

        response = genai_client.models.generate_content(
            model=model_to_use,
            contents=prompt,
            config=types.GenerateContentConfig(**generation_config),
        )

        # PROCESSAMENTO SEPARADO E SEGURO
        if is_cv_agent:
            # CV Writers: Retorna texto limpo, SEM JSON
            cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
            return {"cv_otimizado_texto": cleaned_text}
        
        # JSON Agents: Processamento seguro com fallback estruturado
        cleaned_text = clean_json_string(response.text)
        
        # TENTATIVA 1: Parse normal
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ JSON quebrado em [{agent_name}]. Usando Fallback Estruturado.")
            
            # FALLBACK ESTRUTURADO - NUNCA RETORNA TEXTO BRUTO
            if agent_name == "diagnosis":
                return {
                    "nota_ats": 0,
                    "veredito": "Erro na Análise",
                    "analise_por_pilares": {"impacto": 0, "keywords": 0, "ats": 0},
                    "gaps_fatais": [{"erro": "Instabilidade na IA", "evidencia": "Não foi possível processar o arquivo.", "correcao_sugerida": "Tente novamente."}],
                    "resumo_otimizado": "",
                    "linkedin_headline": ""
                }
            elif agent_name == "library":
                return {
                    "biblioteca_tecnica": [
                        {"titulo": "Clean Code", "autor": "Robert C. Martin", "motivo": "Essencial para código de qualidade."}
                    ]
                }
            elif agent_name == "tactical":
                return {
                    "perguntas_entrevista": [
                        {"pergunta": "Fale sobre sua experiência.", "expectativa_recrutador": "Avaliar comunicação.", "dica_resposta": "Seja claro e objetivo."}
                    ],
                    "projeto_pratico": {
                        "titulo": "Projeto Básico",
                        "descricao": "Implemente uma funcionalidade simples.",
                        "como_apresentar": "Mostre o resultado prático."
                    },
                    "kit_hacker": {
                        "boolean_string": "site:linkedin.com/in desenvolvedor"
                    }
                }
            else:
                # Fallback genérico para qualquer outro agente
                return {
                    "veredito": "Processado com limitações",
                    "gaps_fatais": [],
                    "biblioteca_tecnica": [],
                    "perguntas_entrevista": []
                }

    try:
        return _generate(model_name)

    except Exception as e:
        msg = str(e).lower()
        # Fallback automático para erros de disponibilidade
        if model_name != DEFAULT_MODEL and ("not found" in msg or "404" in msg or "permission" in msg or "403" in msg or "503" in msg or "overloaded" in msg or "unavailable" in msg):
            logger.warning(f"⚠️ Modelo [{model_name}] indisponível. Tentando fallback [{DEFAULT_MODEL}]...")
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
            f"Falha ao chamar o modelo ({agent_name}). Verifique GOOGLE_API_KEY. Detalhe: {type(e).__name__}: {e}",
            agent_name=agent_name,
            model_name=model_name,
        )

def _call_claude(
    system_prompt: str,
    user_content: str,
    agent_name: str,
    model_name: str,
):
    global claude_client
    if not claude_client:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            try:
                claude_client = Anthropic(api_key=api_key)
            except Exception as e:
                logger.error(f"❌ Falha ao inicializar claude_client: {e}")
                return _vant_error(
                    f"Falha ao inicializar cliente Claude. Verifique ANTHROPIC_API_KEY. Detalhe: {type(e).__name__}: {e}",
                    agent_name=agent_name,
                    model_name=model_name,
                )
        else:
            logger.error("❌ claude_client indisponível (ANTHROPIC_API_KEY ausente)")
            return _vant_error(
                "ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente ANTHROPIC_API_KEY.",
                agent_name=agent_name,
                model_name=model_name,
            )

    try:
        # Claude usa formato diferente de prompt
        message = f"""{system_prompt}

{user_content}

Responda APENAS com JSON válido, sem explicações adicionais."""

        response = claude_client.messages.create(
            model=model_name,
            max_tokens=15000 if agent_name == "cv_writer_semantic" else 8192,
            temperature=0.4 if agent_name == "cv_writer_semantic" else 0.2,
            messages=[{"role": "user", "content": message}]
        )

        cleaned_text = clean_json_string(response.content[0].text)
        
        # Tenta fazer parse do JSON
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ JSON quebrado em Claude [{agent_name}]. Tentando reparo...")
            
            # Tenta reparar JSON
            try:
                repaired_text = cleaned_text
                repaired_text = re.sub(r'(?<!\\)"(?=[^,:}\s])', r'\\"', repaired_text)
                return json.loads(repaired_text)
            except:
                # Fallback para texto bruto
                logger.warning(f"⚠️ JSON irrecuperável em Claude [{agent_name}]. Usando fallback.")
                return {
                    "texto_reescrito": response.content[0].text,
                    "cv_otimizado_texto": response.content[0].text,
                    "veredito": "Análise Realizada (Claude Fallback)",
                    "gaps_fatais": [],
                    "biblioteca_tecnica": [],
                    "perguntas_entrevista": []
                }

    except Exception as e:
        logger.error(f"❌ Erro Fatal Claude [{agent_name} | {model_name}]: {e}")
        return _vant_error(
            f"Falha ao chamar Claude ({agent_name}). Verifique ANTHROPIC_API_KEY. Detalhe: {type(e).__name__}: {e}",
            agent_name=agent_name,
            model_name=model_name,
        )

def call_llm(system_prompt: str, payload: str, agent_name: str):
    model = AGENT_MODEL_REGISTRY.get(agent_name, DEFAULT_MODEL)
    
    # Verifica se deve usar Claude
    if model.startswith("claude"):
        return _call_claude(system_prompt, payload, agent_name, model)
    else:
        # Usa Google Gemini (padrão)
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
    # Sanitizar inputs
    from logic import sanitize_input
    cv = sanitize_input(cv)
    job = sanitize_input(job)
    
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
    
    # Sanitizar inputs
    from logic import sanitize_input
    cv_text = sanitize_input(cv_text)
    job_description = sanitize_input(job_description)
    
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
    logger.info("⚡ PARALELIZAÇÃO MÁXIMA + CACHE PARCIAL INTELIGENTE")
    
    # Cache miss - processa com cache parcial inteligente
    start_time = time.time()
    
    # Verificar cache parcial ANTES de processar
    logger.info("🔍 Verificando cache parcial inteligente...")
    
    # Dados para cache parcial
    cache_data = {
        "area": area,
        "job_description": job_description,
        "gaps_fatais": []  # Será preenchido após diagnosis
    }
    
    # Verificar cache parcial para Diagnosis
    diag_cached = cache_manager.check_partial_cache("diagnosis", cache_data, required_keys=['analise_por_pilares', 'gaps_fatais'])
    
    # Verificar cache parcial para Library (baseado na área)
    library_cached = cache_manager.check_partial_cache("library", cache_data, required_keys=['biblioteca_tecnica'])
    
    # Verificar cache parcial para Tactical (baseado na vaga)
    tactical_cached = cache_manager.check_partial_cache("tactical", cache_data, required_keys=['projeto_pratico', 'perguntas_entrevista'])
    
    logger.info(f"📊 Cache Status: Diagnosis={bool(diag_cached)}, Library={bool(library_cached)}, Tactical={bool(tactical_cached)}")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        # Thread 1: Diagnosis (só se não tiver cache)
        if diag_cached:
            logger.info("⚡ Usando Diagnosis do cache parcial")
            diag_result = diag_cached
            gaps = diag_result.get("gaps_fatais", [])
        else:
            logger.info("🔄 Processando Diagnosis com IA...")
            future_diag = executor.submit(agent_diagnosis, cv_text, job_description)
            try:
                diag_result = future_diag.result(timeout=60)  # Timeout de 60s
            except concurrent.futures.TimeoutError:
                logger.error("❌ Timeout no agent_diagnosis")
                diag_result = {"veredito": "Timeout", "gaps_fatais": []}
            except Exception as e:
                logger.error(f"❌ Erro no agent_diagnosis: {e}")
                diag_result = {"veredito": "Erro", "gaps_fatais": []}
            
            gaps = diag_result.get("gaps_fatais", [])
            # Salvar no cache parcial
            cache_data["gaps_fatais"] = gaps
            cache_manager.save_partial_cache_safe("diagnosis", cache_data, diag_result)
        
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
        
        # Thread 3: CV Pipeline (crítico, depende do Diagnosis)
        strategy_payload = {
            "cv_original": cv_text,
            "diagnostico": diag_result,
            "vaga": job_description,
        }
        future_cv = executor.submit(run_cv_pipeline, cv_text, strategy_payload)
        
        # Thread 4: Library (cache parcial ou processamento)
        if library_cached:
            logger.info("⚡ Usando Library do cache parcial")
            library_result = library_cached
        else:
            logger.info("🔄 Processando Library com IA...")
            future_library = executor.submit(agent_library, job_description, gaps, books_catalog)
            try:
                library_result = future_library.result(timeout=60)  # Timeout de 60s
            except concurrent.futures.TimeoutError:
                logger.error("❌ Timeout no agent_library")
                library_result = {"biblioteca_tecnica": []}
            except Exception as e:
                logger.error(f"❌ Erro no agent_library: {e}")
                library_result = {"biblioteca_tecnica": []}
            # Salvar no cache parcial
            cache_manager.save_partial_cache_safe("library", cache_data, library_result)
        
        # Thread 5: Tactical (cache parcial ou processamento)
        if tactical_cached:
            logger.info("⚡ Usando Tactical do cache parcial")
            tactical_result = tactical_cached
        else:
            logger.info("🔄 Processando Tactical com IA...")
            future_tactical = executor.submit(agent_tactical, job_description, gaps)
            try:
                tactical_result = future_tactical.result(timeout=60)  # Timeout de 60s
            except concurrent.futures.TimeoutError:
                logger.error("❌ Timeout no agent_tactical")
                tactical_result = {"perguntas_entrevista": [], "kit_hacker": {}}
            except Exception as e:
                logger.error(f"❌ Erro no agent_tactical: {e}")
                tactical_result = {"perguntas_entrevista": [], "kit_hacker": {}}
            # Salvar no cache parcial
            cache_manager.save_partial_cache_safe("tactical", cache_data, tactical_result)

        # Coleta resultado do CV (sempre processa)
        try:
            cv_result = future_cv.result(timeout=120)  # Timeout maior para CV pipeline
        except concurrent.futures.TimeoutError:
            logger.error("❌ Timeout no run_cv_pipeline")
            cv_result = {"cv_otimizado_completo": "Timeout no processamento do CV"}
        except Exception as e:
            logger.error(f"❌ Erro no run_cv_pipeline: {e}")
            cv_result = {"cv_otimizado_completo": "Erro no processamento do CV"}
        
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
            try:
                comp_result = future_comp.result(timeout=60)  # Timeout de 60s
            except concurrent.futures.TimeoutError:
                logger.error("❌ Timeout no agent_competitor_analysis")
                comp_result = {}
            except Exception as e:
                logger.error(f"❌ Erro no agent_competitor_analysis: {e}")
                comp_result = {}
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
    
    # Calcular estatísticas de cache
    try:
        cache_hits = int(sum([bool(diag_cached), bool(library_cached), bool(tactical_cached)]))
        cache_total = int(3)
        
        # Evitar divisão por zero e garantir tipos numéricos
        if cache_total > 0:
            cache_efficiency = int((int(cache_hits) / int(cache_total)) * 100)
        else:
            cache_efficiency = 0
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Erro ao calcular cache efficiency: {e}")
        cache_hits = 0
        cache_total = 3
        cache_efficiency = 0
    
    logger.info(f"⚡ TEMPO TOTAL: {total_time:.1f}s (CACHE PARCIAL: {cache_hits}/{cache_total} = {cache_efficiency:.0f}% HIT)")
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