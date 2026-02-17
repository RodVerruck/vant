from __future__ import annotations

import io
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, List

import sentry_sdk
from fastapi import FastAPI, File, Form, UploadFile, Request, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Shared dependencies (config, supabase, PRICING, helpers)
from dependencies import (
    supabase_admin,
    STRIPE_SECRET_KEY,
    DEV_MODE,
    settings,
    IS_DEV,
)

# Routers
from interview_endpoints import router as interview_router
from routers.debug import router as debug_router
from routers.admin import router as admin_router
from routers.documents import router as documents_router
from routers.user import router as user_router
from routers.analysis import router as analysis_router
from routers.stripe_routes import router as stripe_router

# Monitoring
from monitoring import init_monitoring

logger = logging.getLogger(__name__)

# Interview question generators (complex internal deps, stay in main)
try:
    from generate_questions_fixed import _generate_interview_questions_wow_fixed
    try:
        from question_generator_wow import generate_dynamic_questions_wow
        def _generate_interview_questions_wow(report_data: dict, mode: str, difficulty: str, focus_areas: List[str]) -> List[dict]:
            """Função wrapper que usa o gerador WOW dinâmico"""
            try:
                return generate_dynamic_questions_wow(
                    sector=report_data.get("setor_detectado", "Tecnologia"),
                    gaps_fatais=report_data.get("gaps_fatais", []),
                    job_description=report_data.get("job_description", ""),
                    mode=mode,
                    difficulty=difficulty,
                    num_questions=5
                )
            except Exception as e:
                logger.warning(f"⚠️ Gerador WOW falhou, usando fallback: {e}")
                return _generate_interview_questions_wow_fixed(report_data, mode, difficulty, focus_areas)
    except ImportError:
        logger.info("📦 Gerador WOW não disponível, usando função fixa")
        _generate_interview_questions_wow = _generate_interview_questions_wow_fixed
except ImportError:
    pass

# ============================================================
# APP SETUP
# ============================================================

app = FastAPI(title="Vant API", version="0.1.0")

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monitoring
init_monitoring()

# Log de inicialização
if DEV_MODE:
    print("\n" + "="*60)
    print("🔧 MODO DE DESENVOLVIMENTO ATIVADO")
    print("   IA será substituída por mocks instantâneos")
    print("   Nenhum token será gasto")
    print("="*60 + "\n")
else:
    print("\n" + "="*60)
    print("🤖 MODO DE PRODUÇÃO ATIVADO")
    print("   IA real será processada")
    print("   Tokens serão consumidos")
    print("="*60 + "\n")

# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(interview_router)
app.include_router(debug_router)
app.include_router(admin_router)
app.include_router(documents_router)
app.include_router(user_router)
app.include_router(analysis_router)
app.include_router(stripe_router)


# ============================================================
# HEALTH CHECK
# ============================================================

health_cache = {"last_check": 0, "status": None}

def check_dependencies() -> dict[str, Any]:
    """Verifica status das dependências externas."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }
    
    overall_healthy = True
    
    # 1. Verificar Supabase
    try:
        if supabase_admin:
            supabase_admin.table("subscriptions").select("id").limit(1).execute()
            health_status["checks"]["supabase"] = "ok"
        else:
            health_status["checks"]["supabase"] = "not_configured"
            overall_healthy = False
    except Exception as e:
        health_status["checks"]["supabase"] = f"error: {str(e)[:50]}"
        overall_healthy = False
    
    # 2. Verificar Google AI
    try:
        from google import genai
        genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        health_status["checks"]["google_ai"] = "ok"
    except Exception as e:
        health_status["checks"]["google_ai"] = f"error: {str(e)[:50]}"
        overall_healthy = False
    
    # 3. Verificar Stripe
    try:
        if STRIPE_SECRET_KEY:
            health_status["checks"]["stripe"] = "ok"
        else:
            health_status["checks"]["stripe"] = "not_configured"
            overall_healthy = False
    except Exception as e:
        health_status["checks"]["stripe"] = f"error: {str(e)[:50]}"
        overall_healthy = False
    
    # 4. Status geral
    if not overall_healthy:
        health_status["status"] = "degraded"
    
    return health_status

@app.get("/health")
def health() -> JSONResponse:
    """Health check completo do sistema com cache de 60 segundos."""
    now = time.time()
    if now - health_cache["last_check"] > 60 or health_cache["status"] is None:
        health_cache["status"] = check_dependencies()
        health_cache["last_check"] = now
    
    status = health_cache["status"]
    
    if status["status"] == "degraded":
        return JSONResponse(status_code=503, content=status)
    
    return JSONResponse(content=status)


@app.get("/api/test-sentry-error")
def test_sentry_error() -> JSONResponse:
    """Endpoint de teste para verificar integração com Sentry."""
    sentry_sdk.set_tag("endpoint", "test_sentry_error")
    sentry_sdk.set_level("error")
    
    # Erro intencional para teste
    raise RuntimeError("ERRO DE TESTE - Verificar integração Sentry")


# ============================================================
# INTERVIEW ENDPOINTS (complex internal deps, stay in main)
# ============================================================

@app.post("/api/interview/analyze")
@limiter.limit("10/minute")
async def analyze_interview_response(
    request: Request,
    audio_file: UploadFile = File(...),
    question: str = Form(...),
    job_context: str = Form(""),
    user_id: str = Form(None)
) -> JSONResponse:
    """
    Endpoint principal para análise de resposta de entrevista.
    Transcreve o áudio e analisa a resposta usando IA.
    """
    sentry_sdk.set_tag("endpoint", "interview_analyze")
    
    try:
        # Validar arquivo de áudio
        content_type = audio_file.content_type.lower() if audio_file.content_type else ""
        filename = audio_file.filename.lower() if audio_file.filename else ""
        
        # Verificar se é áudio pelo content-type ou extensão
        is_audio = (
            content_type.startswith('audio/') or
            filename.endswith('.wav') or
            filename.endswith('.mp3') or
            filename.endswith('.webm') or
            filename.endswith('.ogg') or
            filename.endswith('.m4a')
        )
        
        if not is_audio:
            return JSONResponse(
                status_code=400,
                content={"error": "Arquivo inválido. Envie um arquivo de áudio (WAV, MP3, WebM, OGG, M4A)."}
            )
        
        # Ler bytes do áudio
        audio_bytes = await audio_file.read()
        
        # DEV: Usar config centralizado | PROD: Usar hardcoded
        max_size = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024 if settings and IS_DEV else 10 * 1024 * 1024
        if len(audio_bytes) > max_size:
            return JSONResponse(
                status_code=400,
                content={"error": f"Arquivo muito grande. Máximo {max_size // (1024 * 1024)}MB."}
            )
        
        # Transcrever áudio com Gemini (mais econômico e integrado)
        from llm_core import transcribe_audio_gemini, analyze_interview_gemini
        
        transcription = transcribe_audio_gemini(audio_bytes)
        
        if transcription.startswith("Erro"):
            return JSONResponse(
                status_code=500,
                content={"error": "Falha na transcrição do áudio"}
            )
        
        # Analisar resposta
        feedback = analyze_interview_gemini(question, transcription, job_context)
        
        # Salvar apenas transcrição e feedback (sem áudio para economizar espaço)
        if user_id and supabase_admin:
            try:
                session_data = {
                    "user_id": user_id,
                    "question": question,
                    "transcription": transcription,
                    "feedback": feedback,
                    "created_at": datetime.utcnow().isoformat()
                }
                supabase_admin.table("interview_sessions").insert(session_data).execute()
            except Exception as save_error:
                logger.warning(f"⚠️ Erro ao salvar sessão: {save_error}")
        
        return JSONResponse(content=feedback)
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro na análise de entrevista: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@app.post("/api/interview/generate-questions")
@limiter.limit("20/minute")
async def generate_interview_questions(
    request: Request,
    cv_analysis_id: str = Form(...),
    mode: str = Form("standard"),
    difficulty: str = Form("intermediate"),
    focus_areas: List[str] = Form(default=[])
) -> JSONResponse:
    """
    Gera perguntas ultra-personalizadas baseadas na análise completa do CV.
    """
    sentry_sdk.set_tag("endpoint", "interview_generate_questions")
    
    try:
        if not supabase_admin:
            return JSONResponse(
                status_code=500,
                content={"error": "Database não configurada"}
            )
        
        # Buscar análise completa do CV
        result = supabase_admin.table("analysis_sessions")\
            .select("result_data")\
            .eq("id", cv_analysis_id)\
            .single()\
            .execute()
        
        if not result.data:
            return JSONResponse(
                status_code=404,
                content={"error": "Análise não encontrada"}
            )
        
        report_data = result.data["result_data"]
        
        # Gerar perguntas ultra-personalizadas
        questions = _generate_interview_questions_wow(report_data, mode, difficulty, focus_areas)
        
        return JSONResponse(content={
            "questions": questions,
            "total_questions": len(questions),
            "mode": mode,
            "difficulty": difficulty,
            "sector": report_data.get("setor_detectado", "Tecnologia"),
            "experience_level": _detect_experience_level(report_data),
            "focus_areas": focus_areas
        })
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao gerar perguntas personalizadas: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@app.post("/api/interview/pre-analysis")
@limiter.limit("10/minute")
async def pre_interview_analysis(
    request: Request,
    cv_analysis_id: str = Form(...),
    target_job: str = Form(""),
    interview_date: str = Form("")  # ISO string
) -> JSONResponse:
    """
    Analisa prontificação do candidato e gera plano de preparação.
    """
    sentry_sdk.set_tag("endpoint", "interview_pre_analysis")
    
    try:
        if not supabase_admin:
            return JSONResponse(
                status_code=500,
                content={"error": "Database não configurada"}
            )
        
        # Buscar análise completa do CV
        result = supabase_admin.table("analysis_sessions")\
            .select("result_data")\
            .eq("id", cv_analysis_id)\
            .single()\
            .execute()
        
        if not result.data:
            return JSONResponse(
                status_code=404,
                content={"error": "Análise não encontrada"}
            )
        
        report_data = result.data["result_data"]
        
        # Análise de prontificação
        readiness_analysis = _analyze_interview_readiness(report_data, target_job, interview_date)
        
        return JSONResponse(content=readiness_analysis)
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro na pré-análise: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@app.post("/api/interview/analyze-advanced")
@limiter.limit("10/minute")
async def analyze_interview_advanced(
    request: Request,
    audio_file: UploadFile = File(...),
    question: str = Form(...),
    cv_context: str = Form("{}"),
    interview_mode: str = Form("standard"),
    user_id: str = Form(None)
) -> JSONResponse:
    """
    Análise avançada com contexto completo do CV e benchmark.
    """
    sentry_sdk.set_tag("endpoint", "interview_analyze_advanced")
    
    try:
        # Validar arquivo de áudio
        content_type = audio_file.content_type.lower() if audio_file.content_type else ""
        filename = audio_file.filename.lower() if audio_file.filename else ""
        
        # Verificar se é áudio pelo content-type ou extensão
        is_audio = (
            content_type.startswith('audio/') or
            filename.endswith('.wav') or
            filename.endswith('.mp3') or
            filename.endswith('.webm') or
            filename.endswith('.ogg') or
            filename.endswith('.m4a')
        )
        
        if not is_audio:
            return JSONResponse(
                status_code=400,
                content={"error": "Arquivo inválido. Envie um arquivo de áudio (WAV, MP3, WebM, OGG, M4A)."}
            )
        
        # Ler bytes do áudio
        audio_bytes = await audio_file.read()
        
        # DEV: Usar config centralizado | PROD: Usar hardcoded
        max_size = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024 if settings and IS_DEV else 10 * 1024 * 1024
        if len(audio_bytes) > max_size:
            return JSONResponse(
                status_code=400,
                content={"error": f"Arquivo muito grande. Máximo {max_size // (1024 * 1024)}MB."}
            )
        
        # Transcrever áudio com Gemini
        from llm_core import transcribe_audio_gemini
        
        transcription = transcribe_audio_gemini(audio_bytes)
        
        if transcription.startswith("Erro"):
            return JSONResponse(
                status_code=500,
                content={"error": "Falha na transcrição do áudio"}
            )
        
        # Parse do contexto do CV
        try:
            cv_data = json.loads(cv_context) if cv_context else {}
        except json.JSONDecodeError:
            cv_data = {}
        
        # Análise avançada
        feedback = _analyze_interview_advanced(
            question=question,
            transcription=transcription,
            cv_context=cv_data,
            interview_mode=interview_mode
        )
        
        # Salvar apenas transcrição e feedback (sem áudio)
        if user_id and supabase_admin:
            try:
                session_data = {
                    "user_id": user_id,
                    "question": question,
                    "transcription": transcription,
                    "feedback": feedback,
                    "interview_mode": interview_mode,
                    "cv_context": cv_context,
                    "created_at": datetime.utcnow().isoformat()
                }
                supabase_admin.table("interview_sessions_enhanced").insert(session_data).execute()
            except Exception as save_error:
                logger.warning(f"⚠️ Erro ao salvar sessão avançada: {save_error}")
        
        return JSONResponse(content=feedback)
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro na análise avançada: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@app.get("/api/interview/questions/{cv_analysis_id}")
def get_interview_questions(cv_analysis_id: str) -> JSONResponse:
    """
    Gera perguntas personalizadas baseadas na análise do CV.
    """
    sentry_sdk.set_tag("endpoint", "interview_questions")
    
    try:
        if not supabase_admin:
            return JSONResponse(
                status_code=500,
                content={"error": "Database não configurada"}
            )
        
        # Buscar análise do CV
        result = supabase_admin.table("analysis_sessions")\
            .select("result_data")\
            .eq("id", cv_analysis_id)\
            .single()\
            .execute()
        
        if not result.data:
            return JSONResponse(
                status_code=404,
                content={"error": "Análise não encontrada"}
            )
        
        report_data = result.data["result_data"]
        
        # Gerar perguntas baseadas no CV e setor
        questions = _generate_interview_questions(report_data)
        
        return JSONResponse(content={
            "questions": questions,
            "total_questions": len(questions),
            "sector": report_data.get("setor_detectado", "Tecnologia")
        })
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao gerar perguntas: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


# ============================================================
# INTERVIEW HELPER FUNCTIONS
# ============================================================

def _generate_interview_questions_wow_old(report_data: dict, mode: str, difficulty: str, focus_areas: List[str]) -> List[dict]:
    """
    Gera perguntas ultra-personalizadas baseadas nos gaps do CV e contexto completo.
    Otimização: question_banks movido para constante externa em question_banks.py
    """
    from question_banks import QUESTION_BANKS, CHALLENGING_QUESTIONS
    
    sector = report_data.get("setor_detectado", "Tecnologia")
    experience_level = _detect_experience_level(report_data)
    gaps_fatais = report_data.get("gaps_fatais", [])
    biblioteca_tecnica = report_data.get("biblioteca_tecnica", [])
    
    # Extrair keywords do CV para personalização
    cv_text = report_data.get("cv_otimizado_completo", "")
    
    # Selecionar banco baseado no modo
    mode_questions = QUESTION_BANKS.get(mode, QUESTION_BANKS["warmup"])
    sector_questions = mode_questions.get(sector, mode_questions["Tecnologia"])
    
    # Personalizar perguntas baseado nos gaps
    if gaps_fatais:
        gap_questions = []
        for gap in gaps_fatais[:2]:  # Máximo 2 perguntas sobre gaps
            gap_title = gap.get("titulo", "")
            if "exemplo" in gap_title.lower() or "projetos" in gap_title.lower():
                gap_questions.append({
                    "text": f"Me detalhe um projeto seu que demonstre {gap_title.lower()}",
                    "type": "comportamental",
                    "context": "Use exemplos concretos e resultados mensuráveis.",
                    "focus": ["exemplos", "resultados"]
                })
        
        # Substituir algumas perguntas genéricas pelas de gaps
        if gap_questions:
            sector_questions = sector_questions[:-len(gap_questions)] + gap_questions
    
    # Adicionar perguntas baseadas na biblioteca técnica
    if biblioteca_tecnica and mode in ["technical", "standard"]:
        tech_questions = []
        for book in biblioteca_tecnica[:1]:  # Máximo 1 pergunta sobre livros
            book_title = book.get("titulo", "")
            if book_title:
                tech_questions.append({
                    "text": f"Como os conceitos do livro '{book_title}' se aplicam ao seu trabalho?",
                    "type": "tecnica",
                    "context": "Mostre aplicação prática dos conceitos teóricos.",
                    "focus": ["aplicação", "conhecimento"]
                })
        
        # Adicionar pergunta técnica se houver espaço
        if tech_questions and len(sector_questions) < 5:
            sector_questions.extend(tech_questions)
    
    # Ajustar dificuldade
    if difficulty == "fácil":
        sector_questions = sector_questions[:3]  # Menos perguntas
    elif difficulty == "difícil":
        # Adicionar perguntas mais desafiadoras
        sector_questions.extend(CHALLENGING_QUESTIONS[:1])
    
    # Retornar perguntas finais com IDs e duração
    return [
        {
            "id": i + 1,
            **q,
            "max_duration": 90 if mode == "pressure" else 120
        }
        for i, q in enumerate(sector_questions[:5])  # Máximo 5 perguntas
    ]


def _analyze_interview_readiness(report_data: dict, target_job: str, interview_date: str) -> dict:
    """
    Analisa prontificação do candidato para entrevista.
    """
    gaps_fatais = report_data.get("gaps_fatais", [])
    setor = report_data.get("setor_detectado", "Tecnologia")
    cv_text = report_data.get("cv_otimizado_completo", "")
    
    # Calcular score de prontificação
    base_score = 70  # Score base
    
    # Penalizar gaps
    gap_penalty = min(len(gaps_fatais) * 10, 30)
    
    # Bônus por indicadores de experiência
    experience_bonuses = 0
    if "sênior" in cv_text.lower() or "senior" in cv_text.lower():
        experience_bonuses += 10
    if "lider" in cv_text.lower() or "lead" in cv_text.lower():
        experience_bonuses += 5
    
    # Bônus por biblioteca técnica
    biblioteca = report_data.get("biblioteca_tecnica", [])
    if len(biblioteca) > 3:
        experience_bonuses += 5
    
    readiness_score = max(0, min(100, base_score - gap_penalty + experience_bonuses))
    
    # Identificar gaps críticos
    critical_gaps = []
    for gap in gaps_fatais[:3]:
        gap_title = gap.get("titulo", "")
        if "exemplo" in gap_title.lower():
            critical_gaps.append("Falta de exemplos concretos")
        elif "projetos" in gap_title.lower():
            critical_gaps.append("Detalhamento insuficiente de projetos")
        elif "skills" in gap_title.lower() or "competências" in gap_title.lower():
            critical_gaps.append("Competências técnicas não destacadas")
    
    # Recomendar foco
    recommended_focus = []
    if len(gaps_fatais) > 2:
        recommended_focus.append("comportamental")
    if setor == "Tecnologia":
        recommended_focus.append("técnica")
    if len(critical_gaps) > 0:
        recommended_focus.append("estrutura")
    
    # Estimar dificuldade
    if readiness_score >= 80:
        estimated_difficulty = "avançado"
    elif readiness_score >= 60:
        estimated_difficulty = "intermediário"
    else:
        estimated_difficulty = "básico"
    
    # Calcular tempo de preparação
    prep_time = max(15, len(gaps_fatais) * 10)  # Mínimo 15 minutos
    
    return {
        "readiness_score": readiness_score,
        "critical_gaps": critical_gaps,
        "recommended_focus": recommended_focus[:2],  # Máximo 2 focos
        "estimated_difficulty": estimated_difficulty,
        "prep_time_minutes": prep_time,
        "sector": setor,
        "total_gaps": len(gaps_fatais),
        "experience_indicators": {
            "has_leadership": "lider" in cv_text.lower(),
            "is_senior": any(keyword in cv_text.lower() for keyword in ["sênior", "senior"]),
            "has_projects": "projeto" in cv_text.lower(),
            "tech_breadth": len(biblioteca)
        }
    }


def _analyze_interview_advanced(question: str, transcription: str, cv_context: dict, interview_mode: str) -> dict:
    """
    Análise avançada com benchmark e insights adicionais.
    """
    # Análise base usando função existente
    from llm_core import analyze_interview_gemini
    
    base_feedback = analyze_interview_gemini(question, transcription, cv_context.get("setor_detectado", ""))
    
    # Adicionar camadas WOW
    enhanced_feedback = base_feedback.copy()
    
    # Análise de sentimento (simulada)
    sentiment_score = _analyze_sentiment(transcription)
    enhanced_feedback["sentiment_analysis"] = {
        "confidence": sentiment_score["confidence"],
        "clarity": sentiment_score["clarity"],
        "engagement": sentiment_score["engagement"]
    }
    
    # Benchmark comparison (simulado)
    benchmark = _generate_benchmark_comparison(base_feedback.get("nota_final", 0))
    enhanced_feedback["benchmark_comparison"] = benchmark
    
    # Cultural fit analysis
    cultural_fit = _analyze_cultural_fit(transcription, cv_context)
    enhanced_feedback["cultural_fit"] = cultural_fit
    
    # Next level insights
    insights = _generate_next_level_insights(base_feedback, cv_context)
    enhanced_feedback["next_level_insights"] = insights
    
    return enhanced_feedback


def _analyze_sentiment(text: str) -> dict:
    """
    Análise simplificada de sentimento.
    """
    # Indicadores positivos
    positive_words = ["excelente", "ótimo", "consegui", "sucesso", "aprendi", "cresci", "melhorei"]
    # Indicadores de confiança
    confidence_words = ["tenho certeza", "sem dúvida", "claro", "definitivamente"]
    # Indicadores de engajamento
    engagement_words = ["apaixonado", "motivado", "focado", "dedicado"]
    
    positive_count = sum(1 for word in positive_words if word in text.lower())
    confidence_count = sum(1 for word in confidence_words if word in text.lower())
    engagement_count = sum(1 for word in engagement_words if word in text.lower())
    
    return {
        "confidence": min(100, confidence_count * 25),
        "clarity": min(100, positive_count * 20),
        "engagement": min(100, engagement_count * 30)
    }


def _generate_benchmark_comparison(user_score: int) -> dict:
    """
    Gera comparação com benchmarks (simulado).
    """
    # Médias simuladas baseadas em mercado
    average_approved = 75
    top_10_percent = 90
    
    # Calcular percentil
    if user_score >= top_10_percent:
        percentile = 95
    elif user_score >= average_approved:
        percentile = 70
    else:
        percentile = max(10, user_score - 20)
    
    return {
        "user_score": user_score,
        "average_approved": average_approved,
        "top_10_percent": top_10_percent,
        "percentile": percentile,
        "ranking": "Top 10%" if percentile >= 90 else "Acima da média" if percentile >= 70 else "Abaixo da média"
    }


def _analyze_cultural_fit(transcription: str, cv_context: dict) -> dict:
    """
    Análise de fit cultural (simulada).
    """
    # Indicadores de fit cultural
    collaboration_words = ["equipe", "time", "colaborar", "junto", "grupo"]
    leadership_words = ["liderei", "gerenciei", "coordenei", "orientei"]
    innovation_words = ["inovei", "criei", "desenvolvi", "idealizei"]
    
    collaboration_score = sum(1 for word in collaboration_words if word in transcription.lower())
    leadership_score = sum(1 for word in leadership_words if word in transcription.lower())
    innovation_score = sum(1 for word in innovation_words if word in transcription.lower())
    
    return {
        "company_match": min(100, collaboration_score * 20),
        "team_fit": min(100, collaboration_score * 15),
        "leadership_potential": min(100, leadership_score * 25)
    }


def _generate_next_level_insights(feedback: dict, cv_context: dict) -> dict:
    """
    Gera insights para próximo nível.
    """
    nota = feedback.get("nota_final", 0)
    pontos_melhoria = feedback.get("pontos_melhoria", [])
    
    what_worked_well = []
    critical_improvements = []
    industry_trends = []
    
    if nota >= 80:
        what_worked_well.append("Comunicação clara e estruturada")
        what_worked_well.append("Exemplos concretos e relevantes")
    elif nota >= 60:
        what_worked_well.append("Bom conteúdo técnico")
        critical_improvements.append("Estruturar resposta com método STAR")
    else:
        critical_improvements.append("Desenvolver clareza na comunicação")
        critical_improvements.append("Preparar exemplos específicos")
    
    # Trends baseadas no setor
    setor = cv_context.get("setor_detectado", "Tecnologia")
    if setor == "Tecnologia":
        industry_trends.extend([
            "Foco em cloud e arquitetura distribuída",
            "Ênfase em IA e Machine Learning",
            "Importância de soft skills em tech"
        ])
    
    return {
        "what_worked_well": what_worked_well,
        "critical_improvements": critical_improvements,
        "industry_trends": industry_trends
    }


def _generate_interview_questions(report_data: dict) -> list[dict]:
    """
    Gera perguntas personalizadas baseadas no CV do candidato.
    """
    sector = report_data.get("setor_detectado", "Tecnologia")
    experience_level = _detect_experience_level(report_data)
    
    # Base de perguntas por setor e nível
    question_bank = {
        "Tecnologia": {
            "junior": [
                {
                    "text": "Fale sobre um projeto desafiador que você desenvolveu e qual foi sua maior aprendizagem.",
                    "type": "comportamental",
                    "context": "Use o método STAR para estruturar sua resposta."
                },
                {
                    "text": "Como você mantém suas habilidades técnicas atualizadas?",
                    "type": "comportamental",
                    "context": "Mencione cursos, projetos pessoais ou comunidades."
                },
                {
                    "text": "O que é REST e quais são seus princípios fundamentais?",
                    "type": "tecnica",
                    "context": "Seja claro e direto na explicação técnica."
                }
            ],
            "pleno": [
                {
                    "text": "Descreva uma situação em que você teve que lidar com um bug crítico em produção.",
                    "type": "comportamental",
                    "context": "Foque em resolução de problemas e comunicação."
                },
                {
                    "text": "Como você equilibra qualidade de código e prazos apertados?",
                    "type": "situacional",
                    "context": "Mostre seu processo de tomada de decisão."
                },
                {
                    "text": "Explique a diferença entre async/await e Promises em JavaScript.",
                    "type": "tecnica",
                    "context": "Use exemplos práticos para ilustrar."
                }
            ],
            "senior": [
                {
                    "text": "Como você lidera a arquitetura de um novo projeto?",
                    "type": "comportamental",
                    "context": "Fale sobre trade-offs e decisões técnicas."
                },
                {
                    "text": "Descreva uma situação em que você precisou convencer outras equipes sobre uma decisão técnica.",
                    "type": "comportamental",
                    "context": "Mostre habilidades de comunicação e influência."
                },
                {
                    "text": "Como você avalia a performance e escalabilidade de uma aplicação?",
                    "type": "tecnica",
                    "context": "Mencione métricas e ferramentas que você utiliza."
                }
            ]
        }
    }
    
    # Selecionar perguntas apropriadas
    sector_questions = question_bank.get(sector, question_bank["Tecnologia"])
    level_questions = sector_questions.get(experience_level, sector_questions["pleno"])
    
    # Adicionar perguntas genéricas se necessário
    generic_questions = [
        {
            "text": "Por que você está interessado nesta vaga e nesta empresa?",
            "type": "comportamental",
            "context": "Mostre que você pesquisou sobre a empresa."
        },
        {
            "text": "Onde você se vê em 5 anos?",
            "type": "comportamental",
            "context": "Alinhe suas metas com a oportunidade."
        }
    ]
    
    # Combinar e retornar 5 perguntas
    all_questions = level_questions[:3] + generic_questions[:2]
    
    return [
        {
            "id": i + 1,
            **q,
            "max_duration": 120  # 2 minutos por resposta
        }
        for i, q in enumerate(all_questions)
    ]


def _detect_experience_level(report_data: dict) -> str:
    """
    Detecta nível de experiência baseado no CV.
    """
    cv_text = report_data.get("cv_otimizado_completo", "").lower()
    
    # Keywords por nível
    senior_keywords = ["sênior", "senior", "lead", "architect", "10+", "8+", "9+"]
    pleno_keywords = ["pleno", "middle", "3+", "4+", "5+", "6+", "7+"]
    junior_keywords = ["junior", "estágio", "trainee", "1+", "2+"]
    
    if any(keyword in cv_text for keyword in senior_keywords):
        return "senior"
    elif any(keyword in cv_text for keyword in pleno_keywords):
        return "pleno"
    else:
        return "junior"


@app.post("/api/generate-defense-pitch")
@limiter.limit("10/minute")
async def generate_defense_pitch(request: Request, payload: dict = Body(...)):
    """Generate defense pitch for interview using Gemini Flash-Lite"""
    try:
        prompt = payload.get("prompt", "")
        
        if not prompt or len(prompt) < 10:
            raise HTTPException(status_code=400, detail="Prompt inválido")
        
        # Use Gemini Flash-Lite para gerar o pitch
        from logic import AGENT_MODEL_REGISTRY, DEFAULT_MODEL
        import google.generativeai as genai
        
        model_name = AGENT_MODEL_REGISTRY.get("diagnosis", DEFAULT_MODEL)
        model = genai.GenerativeModel(model_name)
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            pitch = response.text.strip()
            # Validar tamanho
            if 20 <= len(pitch) <= 200:
                return {"pitch": pitch}
        
        # Fallback simples
        return {"pitch": "Minha experiência me preparou com as competências necessárias para este desafio."}
        
    except Exception as e:
        print(f"Error generating defense pitch: {e}")
        # Fallback robusto - nunca falha
        return {"pitch": "Embora minha experiência anterior seja em outra área, desenvolvi habilidades transferíveis que me qualificam para este desafio."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
