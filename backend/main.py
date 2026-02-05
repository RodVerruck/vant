from __future__ import annotations

import io
import logging
import os
import sys
import time
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

# Importar endpoints de persistência
from interview_endpoints import router as interview_router

try:
    from generate_questions_fixed import _generate_interview_questions_wow_fixed
    # Tentar usar o gerador WOW primeiro
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
    # Fallback para função antiga se o arquivo não existir
    pass

# Carrega variáveis de ambiente do arquivo .env na raiz do projeto
PROJECT_ROOT = Path(__file__).parent.parent if '__file__' in globals() else Path('..')
load_dotenv(PROJECT_ROOT / ".env")

# Configuração do logger
logger = logging.getLogger(__name__)

import stripe
from fastapi import FastAPI, File, Form, UploadFile, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from supabase import create_client

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Adiciona PROJECT_ROOT ao path antes dos imports relativos
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from logic import analyze_cv_logic, analyze_preview_lite, extrair_texto_pdf, gerar_pdf_candidato, gerar_word_candidato  # noqa: E402
import uuid

def validate_user_id(user_id: str) -> bool:
    """Valida se user_id é um UUID válido."""
    if not user_id:
        return False
    try:
        uuid.UUID(user_id)
        return True
    except (ValueError, AttributeError):
        return False

try:
    from backend.mock_data import MOCK_PREVIEW_DATA, MOCK_PREMIUM_DATA
except ImportError:
    from mock_data import MOCK_PREVIEW_DATA, MOCK_PREMIUM_DATA

app = FastAPI(title="Vant API", version="0.1.0")

# Incluir router de persistência
app.include_router(interview_router)

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    """Timeout global de 180 segundos para todas as requests."""
    try:
        return await asyncio.wait_for(call_next(request), timeout=180.0)
    except asyncio.TimeoutError:
        logger.error(f"⏱️ Timeout na rota: {request.url.path}")
        return JSONResponse(
            status_code=504,
            content={"error": "Request timeout. Tente novamente em alguns instantes."}
        )

# Configuração de Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Inicializa monitoring de produção
from backend.monitoring import init_monitoring
init_monitoring()

# Modo de desenvolvimento (true = usa mock, false = usa IA real)
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

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

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# Novos Price IDs - Modelo Simplificado
STRIPE_PRICE_ID_PRO_MONTHLY = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY")  # R$ 27,90/mês
STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD")  # R$ 19,90/mês (desconto vitalício)
STRIPE_PRICE_ID_PRO_ANNUAL = os.getenv("STRIPE_PRICE_ID_PRO_ANNUAL")    # R$ 239/ano
STRIPE_PRICE_ID_TRIAL = os.getenv("STRIPE_PRICE_ID_TRIAL")              # R$ 1,99 trial 7 dias
STRIPE_PRICE_ID_CREDIT_1 = os.getenv("STRIPE_PRICE_ID_CREDIT_1")        # R$ 12,90 (1 CV)
STRIPE_PRICE_ID_CREDIT_3 = os.getenv("STRIPE_PRICE_ID_CREDIT_3")        # R$ 29,90 (3 CVs)
STRIPE_PRICE_ID_CREDIT_5 = os.getenv("STRIPE_PRICE_ID_CREDIT_5")        # R$ 49,90 (5 CVs)

FRONTEND_CHECKOUT_RETURN_URL = os.getenv("FRONTEND_CHECKOUT_RETURN_URL") or "http://localhost:3000/app"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validação de variáveis críticas
REQUIRED_ENV_VARS = {
    "SUPABASE_URL": SUPABASE_URL,
    "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_ROLE_KEY,
    "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
    "STRIPE_SECRET_KEY": STRIPE_SECRET_KEY
}

missing_vars = [var for var, value in REQUIRED_ENV_VARS.items() if not value]

if missing_vars:
    print("\n" + "="*60)
    print("❌ ERRO CRÍTICO: Variáveis de ambiente ausentes:")
    for var in missing_vars:
        print(f"   - {var}")
    print("="*60 + "\n")
    raise RuntimeError(f"Variáveis ausentes: {', '.join(missing_vars)}")

supabase_admin = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PRICING: dict[str, dict[str, Any]] = {
    # TIER GRATUITO
    "free": {
        "price": 0,
        "name": "Gratuito",
        "stripe_price_id": None,
        "credits": 1,
        "billing": "free",
        "features": [
            "1 Análise Completa",
            "Score ATS Detalhado",
            "43 Critérios Avaliados",
            "3 Sugestões de Melhoria"
        ]
    },
    
    # TIER PRO - MENSAL
    "pro_monthly": {
        "price": 27.90,
        "name": "PRO Mensal",
        "stripe_price_id": STRIPE_PRICE_ID_PRO_MONTHLY,
        "credits": 30,
        "billing": "subscription",
        "period": "monthly",
        "features": [
            "30 Otimizações por mês",
            "Download de CV Otimizado (PDF + Word)",
            "Simulador de Entrevista com IA",
            "X-Ray Search - Encontre Recrutadores",
            "Biblioteca Recomendada"
        ]
    },
    
    # TIER PRO - MENSAL EARLY BIRD (Desconto Vitalício)
    "pro_monthly_early_bird": {
        "price": 19.90,
        "name": "PRO Mensal (Early Bird)",
        "stripe_price_id": STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD,
        "credits": 30,
        "billing": "subscription",
        "period": "monthly",
        "discount": "Desconto Vitalício",
        "features": [
            "30 Otimizações por mês",
            "Download de CV Otimizado (PDF + Word)",
            "Simulador de Entrevista com IA",
            "X-Ray Search - Encontre Recrutadores",
            "Biblioteca Recomendada",
            "🔥 Preço vitalício de R$ 19,90/mês"
        ]
    },
    
    # TIER PRO - ANUAL (29% OFF)
    "pro_annual": {
        "price": 239.00,
        "price_monthly": 19.92,
        "name": "PRO Anual",
        "stripe_price_id": STRIPE_PRICE_ID_PRO_ANNUAL,
        "credits": 30,
        "billing": "subscription",
        "period": "annual",
        "discount": "29% OFF",
        "features": [
            "30 Otimizações por mês",
            "Download de CV Otimizado (PDF + Word)",
            "Simulador de Entrevista com IA",
            "X-Ray Search - Encontre Recrutadores",
            "Biblioteca Recomendada",
            "Economize 29% vs mensal"
        ]
    },
    
    # TRIAL DE 7 DIAS - R$ 1,99
    "trial": {
        "price": 1.99,
        "name": "Trial 7 Dias",
        "stripe_price_id": STRIPE_PRICE_ID_TRIAL,
        "credits": 3,
        "billing": "trial",
        "trial_days": 7,
        "converts_to": "pro_monthly_early_bird",
        "features": [
            "Teste PRO por 7 dias - apenas R$ 1,99",
            "3 otimizações para testar",
            "Reembolso automático se cancelar em 48h",
            "Após 7 dias: R$ 19,90/mês (desconto vitalício)"
        ]
    },
    
    # CRÉDITOS AVULSOS - 1 CV
    "credit_1": {
        "price": 12.90,
        "name": "Crédito Único",
        "stripe_price_id": STRIPE_PRICE_ID_CREDIT_1,
        "credits": 1,
        "billing": "one_time",
        "features": [
            "1 otimização completa",
            "Download de CV Otimizado",
            "Uso único, sem recorrência"
        ]
    },
    
    # CRÉDITOS AVULSOS - 3 CVs (23% OFF)
    "credit_3": {
        "price": 29.90,
        "price_per_cv": 9.97,
        "name": "Pacote 3 CVs",
        "stripe_price_id": STRIPE_PRICE_ID_CREDIT_3,
        "credits": 3,
        "billing": "one_time",
        "discount": "23% OFF",
        "features": [
            "3 otimizações completas",
            "Download de CV Otimizado",
            "Economize 23% vs crédito único",
            "Válido por 6 meses"
        ]
    },
    
    # CRÉDITOS AVULSOS - 5 CVs (22% OFF)
    "credit_5": {
        "price": 49.90,
        "price_per_cv": 9.98,
        "name": "Pacote 5 CVs",
        "stripe_price_id": STRIPE_PRICE_ID_CREDIT_5,
        "credits": 5,
        "billing": "one_time",
        "discount": "22% OFF",
        "features": [
            "5 otimizações completas",
            "Download de CV Otimizado",
            "Economize 22% vs crédito único",
            "Válido por 6 meses"
        ]
    },
}

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _upload_to_bytes_io(upload: UploadFile) -> io.BytesIO:
    b = upload.file.read()
    return io.BytesIO(b)


def _save_to_cache(file_bytes: bytes, job_description: str) -> None:
    """Salva CV e job description no cache para facilitar geração de mocks."""
    try:
        cache_dir = PROJECT_ROOT / ".cache"
        cache_dir.mkdir(exist_ok=True)
        
        # Salva CV
        cv_path = cache_dir / "last_cv.pdf"
        with open(cv_path, 'wb') as f:
            f.write(file_bytes)
        
        # Salva descrição da vaga
        job_path = cache_dir / "last_job.txt"
        with open(job_path, 'w', encoding='utf-8') as f:
            f.write(job_description)
        
        print(f"💾 Cache atualizado: {cv_path.name} + job description")
    except Exception as e:
        print(f"⚠️  Erro ao salvar cache: {e}")


# Cache para health check (evita chamadas excessivas a serviços externos)
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
    # Só verifica dependências a cada 60 segundos ou na primeira vez
    now = time.time()
    if now - health_cache["last_check"] > 60 or health_cache["status"] is None:
        # Roda verificações completas
        health_cache["status"] = check_dependencies()
        health_cache["last_check"] = now
    
    status = health_cache["status"]
    
    # Retorna status 503 se degraded, 200 se healthy
    if status["status"] == "degraded":
        return JSONResponse(status_code=503, content=status)
    
    return JSONResponse(content=status)


@app.get("/api/test-sentry-error")
def test_sentry_error() -> JSONResponse:
    """Endpoint de teste para verificar integração com Sentry."""
    import sentry_sdk
    
    sentry_sdk.set_tag("endpoint", "test_sentry_error")
    sentry_sdk.set_level("error")
    
    # Erro intencional para teste
    raise RuntimeError("ERRO DE TESTE - Verificar integração Sentry")


@app.get("/api/pricing")
def get_pricing() -> JSONResponse:
    """Retorna informações de pricing para o frontend."""
    pricing_info = {}
    for plan_id, plan_data in PRICING.items():
        pricing_info[plan_id] = {
            "id": plan_id,
            "name": plan_data.get("name"),
            "price": plan_data.get("price"),
            "billing": plan_data.get("billing"),
            "features": plan_data.get("features", []),
        }
    return JSONResponse(content=pricing_info)


@app.get("/api/analysis/status/{session_id}")
def get_analysis_status(session_id: str) -> JSONResponse:
    """Endpoint para polling do status da análise com progressive loading."""
    import sentry_sdk
    
    sentry_sdk.set_tag("endpoint", "get_analysis_status")
    
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    try:
        # Buscar sessão no Supabase
        response = supabase_admin.table("analysis_sessions").select(
            "status, current_step, result_data, created_at, updated_at"
        ).eq("id", session_id).limit(1).execute()
        
        if not response.data:
            return JSONResponse(
                status_code=404,
                content={"error": "Sessão não encontrada."}
            )
        
        session = response.data[0]
        
        return JSONResponse(content={
            "session_id": session_id,
            "status": session["status"],
            "current_step": session["current_step"],
            "result_data": session["result_data"],
            "created_at": session["created_at"],
            "updated_at": session["updated_at"]
        })
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/analyze-lite")
@limiter.limit("5/minute")  # 5 requests por minuto
def analyze_lite(request: Request, file: UploadFile = File(...), job_description: str = Form(...), area_of_interest: str = Form("")) -> JSONResponse:
    try:
        import sentry_sdk
        sentry_sdk.set_tag("endpoint", "analyze_lite")
        
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Modo de desenvolvimento: retorna mock instantaneamente
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise lite (sem processar IA)")
            return JSONResponse(content=MOCK_PREVIEW_DATA)
        
        # Modo produção: processa com IA real
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        
        # Se o usuário selecionou uma área específica, priorize-a
        if area_of_interest:
            data = analyze_preview_lite(cv_text, job_description, forced_area=area_of_interest)
        else:
            data = analyze_preview_lite(cv_text, job_description)
        
        return JSONResponse(content=data)
    except Exception as e:
        import sentry_sdk
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/analyze-free")
@limiter.limit("5/minute")  # 5 requests por minuto
def analyze_free(
    request: Request,
    file: UploadFile = File(...), 
    job_description: str = Form(...),
    area_of_interest: str = Form(""),
    user_id: str = Form(None)
) -> JSONResponse:
    """
    Análise gratuita (primeira análise sem paywall).
    Retorna diagnóstico básico com problemas identificados e 2 sugestões.
    """
    import sentry_sdk
    
    if user_id:
        sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("endpoint", "analyze_free")
    
    if user_id and not validate_user_id(user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Verifica se usuário já usou análise gratuita (se tiver user_id)
        if user_id and supabase_admin:
            try:
                usage = supabase_admin.table("free_usage").select("used_at").eq("user_id", user_id).limit(1).execute()
                if usage.data:
                    return JSONResponse(
                        status_code=403, 
                        content={"error": "Você já usou sua análise gratuita. Faça upgrade para continuar."}
                    )
            except Exception as e:
                print(f"⚠️ Erro ao verificar uso gratuito: {e}")
        
        # Modo de desenvolvimento: retorna mock instantaneamente
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise gratuita (sem processar IA)")
            # Retorna versão limitada do mock (apenas 2 sugestões)
            limited_data = MOCK_PREVIEW_DATA.copy()
            return JSONResponse(content=limited_data)
        
        # Modo produção: processa com IA real
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        
        # Se o usuário selecionou uma área específica, priorize-a
        if area_of_interest:
            data = analyze_preview_lite(cv_text, job_description, forced_area=area_of_interest)
        else:
            data = analyze_preview_lite(cv_text, job_description)
        
        # Registra uso gratuito
        if user_id and supabase_admin:
            try:
                supabase_admin.table("free_usage").insert({
                    "user_id": user_id,
                    "used_at": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                print(f"⚠️ Erro ao registrar uso gratuito: {e}")
        
        return JSONResponse(content=data)
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GeneratePdfRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@app.post("/api/generate-pdf")
def generate_pdf(request: GeneratePdfRequest) -> StreamingResponse:
    try:
        pdf_bytes = gerar_pdf_candidato(request.data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Curriculo_VANT.pdf"}
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GenerateWordRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@app.post("/api/generate-word")
def generate_word(request: GenerateWordRequest) -> StreamingResponse:
    try:
        word_bytes_io = gerar_word_candidato(request.data)
        word_bytes_io.seek(0)
        return StreamingResponse(
            word_bytes_io,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Curriculo_VANT_Editavel.docx"}
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class EntitlementsStatusRequest(BaseModel):
    user_id: str


@app.get("/api/user/status/{user_id}")
def get_user_status(user_id: str) -> JSONResponse:
    """Endpoint público para verificar se usuário tem plano ativo."""
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado"}
        )
    
    if not validate_user_id(user_id):
        return JSONResponse(
            status_code=400,
            content={"error": "user_id inválido"}
        )
    
    try:
        status = _entitlements_status(user_id)
        return JSONResponse(content={
            "has_active_plan": status.get("payment_verified", False),
            "credits_remaining": status.get("credits_remaining", 0),
            "plan": status.get("plan")
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/entitlements/status")
def entitlements_status(payload: EntitlementsStatusRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if payload.user_id and not validate_user_id(payload.user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class ConsumeOneCreditRequest(BaseModel):
    user_id: str


@app.post("/api/entitlements/consume-one")
def entitlements_consume_one(payload: ConsumeOneCreditRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if payload.user_id and not validate_user_id(payload.user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        _consume_one_credit(payload.user_id)
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})


@app.post("/api/analyze-premium-paid")
@limiter.limit("10/minute")  # 10 requests por minuto para pagos
def analyze_premium_paid(
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Form(...),
    file: UploadFile = File(...),
    job_description: str = Form(...),
    area_of_interest: str = Form(""),
    competitor_files: list[UploadFile] | None = File(None),
) -> JSONResponse:
    import sentry_sdk
    
    sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("endpoint", "analyze_premium_paid")
    
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if user_id and not validate_user_id(user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Verificar créditos (tanto em DEV quanto em produção)
        status = _entitlements_status(user_id)
        if not status.get("payment_verified") or int(status.get("credits_remaining") or 0) <= 0:
            return JSONResponse(status_code=400, content={"error": "Você não tem créditos disponíveis."})

        # Consumir crédito
        _consume_one_credit(user_id)
        
        # Criar sessão de análise para progressive loading
        session_data = {
            "user_id": user_id,
            "status": "processing",
            "current_step": "starting",
            "result_data": {}
        }
        
        session_response = supabase_admin.table("analysis_sessions").insert(session_data).execute()
        session_id = session_response.data[0]["id"]
        
        # Preparar arquivos de competidores se existirem
        competitors_bytes = []
        if competitor_files:
            for f in competitor_files:
                competitors_bytes.append(f.file.read())
        
        # Agendar processamento em background
        background_tasks.add_task(
            _process_analysis_background,
            session_id=session_id,
            user_id=user_id,
            file_bytes=file_bytes,
            job_description=job_description,
            area_of_interest=area_of_interest,
            competitors_bytes=competitors_bytes
        )
        
        # Retornar imediatamente com session_id
        return JSONResponse(content={
            "session_id": session_id,
            "status": "processing"
        })
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class ActivateEntitlementsRequest(BaseModel):
    session_id: str
    user_id: str
    plan_id: str


def _entitlements_status(user_id: str) -> dict[str, Any]:
    if not supabase_admin or not user_id:
        return {"payment_verified": False, "credits_remaining": 0, "plan": None}

    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [None])[0]
    
    print(f"[DEBUG] _entitlements_status: user_id={user_id}, subscription={sub}")

    # Verificar se tem assinatura ativa (qualquer plano)
    if sub and sub.get("subscription_status") == "active":
        plan_name = sub.get("subscription_plan")
        period_start = sub.get("current_period_start")
        
        print(f"[DEBUG] Assinatura ativa encontrada: plan={plan_name}, status={sub.get('subscription_status')}")
        
        # Todos os planos de assinatura (PRO, Trial, premium_plus) usam sistema de usage com limite mensal
        if plan_name in ["pro_monthly", "pro_annual", "trial", "premium_plus"]:
            usage = (
                supabase_admin.table("usage")
                .select("used,usage_limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [None])[0]
            used = int((row or {}).get("used") or 0)
            limit_val = int((row or {}).get("usage_limit") or 30)
            credits_remaining = max(0, limit_val - used)
            return {
                "payment_verified": credits_remaining > 0,
                "credits_remaining": credits_remaining,
                "plan": "premium_plus",
            }

    # Sem assinatura ativa, verificar créditos avulsos
    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [None])[0]
    balance = int((row or {}).get("balance") or 0)
    
    print(f"[DEBUG] Sem assinatura ativa. Créditos avulsos: balance={balance}")
    
    return {
        "payment_verified": balance > 0,
        "credits_remaining": max(0, balance),
        "plan": None,
    }


def _consume_one_credit(user_id: str) -> None:
    if not supabase_admin or not user_id:
        raise RuntimeError("Banco não configurado")

    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [None])[0]
    
    # Todos os planos de assinatura (PRO, Trial, premium_plus) consomem do sistema de usage
    if sub and sub.get("subscription_status") == "active":
        plan_name = sub.get("subscription_plan")
        if plan_name in ["pro_monthly", "pro_annual", "trial", "premium_plus"]:
            period_start = sub.get("current_period_start")
            usage = (
                supabase_admin.table("usage")
                .select("used,usage_limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [None])[0]
            used = int((row or {}).get("used") or 0)
            limit_val = int((row or {}).get("usage_limit") or 30)
            if used >= limit_val:
                raise RuntimeError("Limite mensal atingido")

            if row is None:
                supabase_admin.table("usage").insert(
                    {"user_id": user_id, "period_start": period_start, "used": 1, "usage_limit": limit_val}
                ).execute()
            else:
                supabase_admin.table("usage").update({"used": used + 1}).eq("user_id", user_id).eq(
                    "period_start", period_start
                ).execute()
            return

    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [None])[0]
    balance = int((row or {}).get("balance") or 0)
    if balance <= 0:
        raise RuntimeError("Sem créditos")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": balance - 1}).execute()


@app.post("/api/entitlements/activate")
def activate_entitlements(payload: ActivateEntitlementsRequest) -> JSONResponse:
    import sentry_sdk
    
    sentry_sdk.set_context("user", {"id": payload.user_id})
    sentry_sdk.set_tag("endpoint", "activate_entitlements")
    
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if payload.user_id and not validate_user_id(payload.user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )

    try:
        # Tenta buscar a sessão do Stripe primeiro
        session = None
        is_paid = False
        subscription_id = None
        
        try:
            session = stripe.checkout.Session.retrieve(payload.session_id)
            is_paid = bool(
                session
                and (
                    session.get("payment_status") in ("paid", "no_payment_required")
                    or (session.get("mode") == "subscription" and session.get("status") == "complete")
                )
            )
            if is_paid:
                subscription_id = session.get("subscription")
        except Exception as e:
            print(f"[DEBUG] Sessão Stripe não encontrada ou inválida: {e}")
            # Se a sessão não existe ou é inválida, vamos verificar assinaturas existentes do usuário
            session = None
            is_paid = False
            subscription_id = None
        
        # Se não conseguiu confirmar pela sessão, tenta buscar assinatura existente
        if not is_paid and payload.user_id:
            print(f"[DEBUG] Buscando assinaturas existentes para usuário {payload.user_id}")
            try:
                # Buscar assinaturas ativas do usuário
                subscriptions = stripe.Subscription.list(limit=10)
                for sub in subscriptions.data:
                    # Verificar se esta assinatura pertence ao usuário (via metadata ou customer)
                    customer_id = sub.get("customer")
                    
                    # Tentar encontrar o cliente pelo email do usuário no Supabase
                    if customer_id:
                        customer = stripe.Customer.retrieve(customer_id)
                        if customer.email and customer.email.lower() == "rodrigoverruck@gmail.com":  # Temp hardcoded para teste
                            if sub.status in ["trialing", "active"]:
                                is_paid = True
                                subscription_id = sub.id
                                print(f"[DEBUG] Assinatura encontrada: {sub.id}, Status: {sub.status}")
                                break
            except Exception as e:
                print(f"[DEBUG] Erro ao buscar assinaturas: {e}")
        
        if not is_paid:
            return JSONResponse(status_code=400, content={"error": "Pagamento não confirmado ou assinatura não encontrada."})

        # Se temos session_id, usa metadata da sessão, senão usa plano do payload
        if session:
            meta = session.get("metadata") or {}
            plan_id = (meta.get("plan") or payload.plan_id or "basico").strip()
        else:
            plan_id = (payload.plan_id or "basico").strip()
            
        if plan_id not in PRICING:
            plan_id = "basico"

        plan = PRICING[plan_id]
        billing = (plan.get("billing") or "one_time").strip().lower()

        if billing == "subscription":
            subscription_id = session.get("subscription")
            if not subscription_id:
                return JSONResponse(status_code=400, content={"error": "Assinatura não encontrada nesta sessão do Stripe."})

            sub = stripe.Subscription.retrieve(subscription_id)
            cps = int(sub.get("current_period_start") or 0)
            cpe = int(sub.get("current_period_end") or 0)

            # Converter timestamps Unix para ISO format para PostgreSQL TIMESTAMPTZ
            # Stripe pode retornar em segundos ou milissegundos
            if cps > 1000000000000:  # Se for milissegundos
                cps = cps // 1000
            if cpe > 1000000000000:  # Se for milissegundos
                cpe = cpe // 1000
            
            period_start_iso = datetime.fromtimestamp(cps).isoformat()
            period_end_iso = datetime.fromtimestamp(cpe).isoformat()
            
            print(f"[DEBUG] Timestamps: raw={cps},{cpe} iso={period_start_iso},{period_end_iso}")

            # Verificar se já existe assinatura para este usuário
            existing = (
                supabase_admin.table("subscriptions")
                .select("id")
                .eq("user_id", payload.user_id)
                .limit(1)
                .execute()
            )
            
            subscription_data = {
                "user_id": payload.user_id,
                "subscription_plan": plan_id,  # Usar plan_id dinâmico, não hardcoded
                "stripe_subscription_id": subscription_id,
                "subscription_status": sub.get("status"),
                "current_period_start": period_start_iso,
                "current_period_end": period_end_iso,
            }
            
            if existing.data:
                # Update existing subscription
                supabase_admin.table("subscriptions").update(subscription_data).eq(
                    "user_id", payload.user_id
                ).execute()
            else:
                # Insert new subscription
                supabase_admin.table("subscriptions").insert(subscription_data).execute()

            # Criar registro de usage para todos os planos de assinatura (limite de 30 créditos/mês)
            if plan_id in ["pro_monthly", "pro_annual", "trial", "premium_plus"]:
                supabase_admin.table("usage").upsert(
                    {"user_id": payload.user_id, "period_start": period_start_iso, "used": 0, "usage_limit": int(plan.get("credits") or 30)}
                ).execute()

            # Todos os planos de assinatura têm 30 créditos mensais
            credits_remaining = int(plan.get("credits") or 30)
        else:
            purchased_credits = int(plan.get("credits") or 1)
            existing = (
                supabase_admin.table("user_credits")
                .select("balance")
                .eq("user_id", payload.user_id)
                .limit(1)
                .execute()
            )
            row = (existing.data or [None])[0]
            balance = int((row or {}).get("balance") or 0)
            new_balance = balance + purchased_credits
            print(f"[DEBUG] activate_entitlements: user_id={payload.user_id} plan={plan_id} purchased={purchased_credits} old_balance={balance} new_balance={new_balance}")
            supabase_admin.table("user_credits").upsert({"user_id": payload.user_id, "balance": new_balance}).execute()
            credits_remaining = new_balance

        return JSONResponse(
            content={
                "ok": True,
                "plan_id": plan_id,
                "credits_remaining": credits_remaining,
            }
        )
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] activate_entitlements: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        # Salvar sessão para retry posterior
        try:
            supabase_admin.table("failed_activations").insert({
                "user_id": payload.user_id,
                "session_id": payload.session_id,
                "error_message": str(e),
                "created_at": datetime.now().isoformat()
            }).execute()
        except:
            pass  # Se falhar ao salvar, não quebrar o fluxo
        
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/debug/reset-credits")
def reset_credits(payload: dict):
    """DEBUG ONLY: Reseta créditos do usuário para 3."""
    if not supabase_admin:
        raise HTTPException(status_code=500, detail="Supabase não configurado")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id obrigatório")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": 3}).execute()
    return {"ok": True, "credits": 3}


@app.post("/api/analyze-premium")
def analyze_premium(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    competitor_files: list[UploadFile] | None = File(None),
) -> JSONResponse:
    try:
        cv_text = extrair_texto_pdf(_upload_to_bytes_io(file))
        competitors = []
        if competitor_files:
            for f in competitor_files:
                competitors.append(_upload_to_bytes_io(f))
        data = analyze_cv_logic(cv_text, job_description, competitors, user_id=user_id)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/render/pdf")
def render_pdf(payload: dict[str, Any]) -> StreamingResponse:
    pdf_bytes = gerar_pdf_candidato(payload)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vant.pdf"},
    )


@app.post("/api/render/docx")
def render_docx(payload: dict[str, Any]) -> StreamingResponse:
    docx_bytes = gerar_word_candidato(payload)
    if hasattr(docx_bytes, "getvalue"):
        docx_bytes = docx_bytes.getvalue()
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=vant.docx"},
    )


class StripeCreateCheckoutSessionRequest(BaseModel):
    plan_id: str
    customer_email: str | None = None
    client_reference_id: str | None = None
    score: int | None = None


@app.post("/api/stripe/create-checkout-session")
def stripe_create_checkout_session(payload: StripeCreateCheckoutSessionRequest) -> JSONResponse:
    import sentry_sdk
    
    sentry_sdk.set_tag("endpoint", "stripe_create_checkout_session")
    if payload.client_reference_id:
        sentry_sdk.set_context("user", {"id": payload.client_reference_id})
    
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})

    plan_id = (payload.plan_id or "basico").strip()
    if plan_id not in PRICING:
        plan_id = "basico"

    price_id = PRICING[plan_id].get("stripe_price_id")
    if not price_id:
        return JSONResponse(
            status_code=500,
            content={"error": f"Stripe Price ID não configurado para o plano '{plan_id}'. Verifique as variáveis de ambiente no Render."},
        )

    billing = (PRICING[plan_id].get("billing") or "one_time").strip().lower()
    is_subscription = billing == "subscription" or billing == "trial"
    success_url = f"{FRONTEND_CHECKOUT_RETURN_URL}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{FRONTEND_CHECKOUT_RETURN_URL}?payment=cancel"

    try:
        # Configuração especial para Paid Trial (R$ 1,99 hoje + 7 dias trial + R$ 19,90/mês depois)
        if plan_id == "trial":
            # Price ID da assinatura (R$ 19,90/mês com trial)
            subscription_price_id = STRIPE_PRICE_ID_TRIAL  # price_1SxSYB2VONQto1dcxJb1Df3U
            
            # Price ID do setup fee (R$ 1,99 pagamento único)
            setup_fee_price_id = "price_1SvoER2VONQto1dcdi5VHNpM"  # R$ 1,99 one-time
            
            session = stripe.checkout.Session.create(
                mode="subscription",
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": subscription_price_id,
                        "quantity": 1,
                    },
                    {
                        "price": setup_fee_price_id,  # Setup fee cobrado agora
                        "quantity": 1,
                    },
                ],
                subscription_data={
                    "trial_period_days": 7,  # Assinatura só começa em 7 dias
                },
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                customer_email=payload.customer_email,
                client_reference_id=payload.client_reference_id,
                metadata={
                    "plan": plan_id,
                    "score": str(int(payload.score or 0)),
                    "setup_fee": "1.99",
                },
            )
        else:
            # Lógica normal para outros planos
            session = stripe.checkout.Session.create(
                mode="subscription" if is_subscription else "payment",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                customer_email=payload.customer_email,
                client_reference_id=payload.client_reference_id,
                metadata={
                    "plan": plan_id,
                    "score": str(int(payload.score or 0)),
                },
            )
        return JSONResponse(content={"id": session.get("id"), "url": session.get("url")})
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class StripeVerifyCheckoutSessionRequest(BaseModel):
    session_id: str


@app.post("/api/stripe/verify-checkout-session")
def stripe_verify_checkout_session(payload: StripeVerifyCheckoutSessionRequest) -> JSONResponse:
    import sentry_sdk
    
    sentry_sdk.set_tag("endpoint", "stripe_verify_checkout_session")
    
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})

    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
        is_paid = bool(
            session
            and (
                session.get("payment_status") in ("paid", "no_payment_required")
                or (session.get("mode") == "subscription" and session.get("status") == "complete")
            )
        )
        meta = session.get("metadata") or {}
        plan_id = (meta.get("plan") or "basico").strip()
        if plan_id not in PRICING:
            plan_id = "basico"

        return JSONResponse(
            content={
                "paid": is_paid,
                "plan_id": plan_id,
                "mode": session.get("mode"),
                "payment_status": session.get("payment_status"),
                "status": session.get("status"),
                "customer_email": session.get("customer_details", {}).get("email"),
            }
        )
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.get("/api/user/history/detail")
def get_history_detail(id: str) -> JSONResponse:
    """Retorna detalhes completos de uma análise específica."""
    try:
        from backend.cache_manager import CacheManager
        
        cache_manager = CacheManager()
        
        # Busca o item completo pelo ID
        response = cache_manager.supabase.table("cached_analyses").select("*").eq("id", id).execute()
        
        if not response.data or len(response.data) == 0:
            return JSONResponse(status_code=404, content={"error": "Análise não encontrada"})
        
        item = response.data[0]
        
        return JSONResponse(content={"data": item["result_json"]})
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.get("/api/user/history")
def get_user_history(user_id: str) -> JSONResponse:
    try:
        from backend.cache_manager import CacheManager
        
        cache_manager = CacheManager()
        history = cache_manager.get_user_history(user_id, limit=10)
        
        # Formata os dados para o frontend
        formatted_history = []
        for item in history:
            formatted_history.append({
                "id": item["id"],
                "created_at": item["created_at"],
                "job_description": item["job_description"][:100] + "..." if len(item["job_description"]) > 100 else item["job_description"],
                "result_preview": {
                    "veredito": item["result_json"].get("veredito", "N/A"),
                    "score_ats": item["result_json"].get("score_ats", 0),
                    "gaps_count": len(item["result_json"].get("gaps_fatais", []))
                }
            })
        
        return JSONResponse(content={"history": formatted_history})
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.get("/api/admin/cache-stats")
def get_cache_stats() -> JSONResponse:
    """
    Endpoint de admin para monitorar estatísticas do cache.
    Retorna dados sobre áreas populares para análise de pre-warming.
    """
    import sentry_sdk
    
    sentry_sdk.set_tag("endpoint", "admin_cache_stats")
    
    try:
        from backend.cache_manager import CacheManager
        
        cache_manager = CacheManager()
        stats = cache_manager.get_cache_stats()
        
        return JSONResponse(content=stats)
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao buscar estatísticas do cache: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


def _process_analysis_background(
    session_id: str,
    user_id: str,
    file_bytes: bytes,
    job_description: str,
    area_of_interest: str,
    competitors_bytes: list[bytes] | None = None
) -> None:
    """
    Função background para processamento assíncrono da análise.
    Usa orquestrador streaming com progressive loading.
    """
    import sentry_sdk
    
    sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("background_task", "process_analysis")
    
    try:
        # Importar orquestrador streaming
        from backend.llm_core import analyze_cv_orchestrator_streaming
        from backend.logic import extrair_texto_pdf
        import io
        
        # Etapa 1: Extrair texto do PDF
        logger.info(f"🔍 Extrando texto do PDF para sessão {session_id}")
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        
        if not cv_text or len(cv_text.strip()) < 100:
            logger.error(f"❌ PDF vazio ou muito pequeno para sessão {session_id}")
            from backend.llm_core import update_session_progress
            update_session_progress(session_id, {"error": "PDF vazio ou inválido"}, "failed")
            return
        
        # Preparar competidores
        competitors_text = None
        if competitors_bytes:
            competitors_texts = []
            for comp_bytes in competitors_bytes:
                comp_text = extrair_texto_pdf(io.BytesIO(comp_bytes))
                if comp_text:
                    competitors_texts.append(comp_text)
            competitors_text = "\n\n---\n\n".join(competitors_texts) if competitors_texts else None
        
        # Carregar catálogo de livros
        try:
            import json
            from pathlib import Path
            books_file = Path(__file__).parent.parent / "data" / "books_catalog.json"
            with open(books_file, 'r', encoding='utf-8') as f:
                books_catalog = json.load(f)
        except Exception as e:
            logger.warning(f"⚠️ Erro ao carregar catálogo de livros: {e}")
            books_catalog = []
        
        # Chamar orquestrador streaming
        logger.info(f"🚀 Iniciando orquestrador streaming para sessão {session_id}")
        analyze_cv_orchestrator_streaming(
            session_id=session_id,
            cv_text=cv_text,
            job_description=job_description,
            area_of_interest=area_of_interest,
            books_catalog=books_catalog,
            competitors_text=competitors_text
        )
        
        logger.info(f"✅ Orquestrador concluído para sessão {session_id}")
        
    except Exception as e:
        logger.error(f"❌ Erro fatal no background task {session_id}: {e}")
        sentry_sdk.capture_exception(e)
        
        # Atualizar status para falha
        try:
            from backend.llm_core import update_session_progress
            error_data = {
                "error": f"Erro fatal no processamento: {str(e)}",
                "error_type": type(e).__name__
            }
            update_session_progress(session_id, error_data, "failed")
        except Exception as update_error:
            logger.error(f"❌ Erro ao atualizar status para failed: {update_error}")


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
    import sentry_sdk
    
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
        
        if len(audio_bytes) > 10 * 1024 * 1024:  # 10MB max
            return JSONResponse(
                status_code=400,
                content={"error": "Arquivo muito grande. Máximo 10MB."}
            )
        
        # Transcrever áudio com Gemini (mais econômico e integrado)
        from backend.llm_core import transcribe_audio_gemini, analyze_interview_gemini
        
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
    import sentry_sdk
    
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
    import sentry_sdk
    
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
    import sentry_sdk
    import json
    
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
        
        if len(audio_bytes) > 10 * 1024 * 1024:  # 10MB max
            return JSONResponse(
                status_code=400,
                content={"error": "Arquivo muito grande. Máximo 10MB."}
            )
        
        # Transcrever áudio com Gemini
        from backend.llm_core import transcribe_audio_gemini
        
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


def _generate_interview_questions_wow_old(report_data: dict, mode: str, difficulty: str, focus_areas: List[str]) -> List[dict]:
    """
    Gera perguntas ultra-personalizadas baseadas nos gaps do CV e contexto completo.
    """
    sector = report_data.get("setor_detectado", "Tecnologia")
    experience_level = _detect_experience_level(report_data)
    gaps_fatais = report_data.get("gaps_fatais", [])
    biblioteca_tecnica = report_data.get("biblioteca_tecnica", [])
    
    # Extrair keywords do CV para personalização
    cv_text = report_data.get("cv_otimizado_completo", "")
    
    # Banco de perguntas WOW por modo e setor
    question_banks = {
        "warmup": {
            "Tecnologia": [
                {
                    "text": f"Qual foi sua maior conquista profissional recente e o que você aprendeu com ela?",
                    "type": "comportamental",
                    "context": "Seja específico e use números quando possível.",
                    "focus": ["confiança", "clareza"]
                },
                {
                    "text": "Como você descreveria seu estilo de trabalho em 3 palavras?",
                    "type": "comportamental",
                    "context": "Pense em como você colabora e resolve problemas.",
                    "focus": ["autoconhecimento", "comunicação"]
                },
                {
                    "text": "O que te motiva a buscar uma nova oportunidade profissional?",
                    "type": "comportamental",
                    "context": "Seja autêntico sobre suas aspirações.",
                    "focus": ["motivação", "carreira"]
                }
            ]
        },
        "technical": {
            "Tecnologia": [
                {
                    "text": f"Explique como você otimizaria o desempenho de uma aplicação que está lenta.",
                    "type": "tecnica",
                    "context": "Fale sobre diagnóstico, ferramentas e soluções.",
                    "focus": ["performance", "problem-solving"]
                },
                {
                    "text": "Como você garante a qualidade do código que produz?",
                    "type": "tecnica",
                    "context": "Mencione testes, code review e boas práticas.",
                    "focus": ["qualidade", "processos"]
                },
                {
                    "text": "Descreva um desafio técnico complexo que você superou.",
                    "type": "comportamental",
                    "context": "Use o método STAR para estruturar sua resposta.",
                    "focus": ["resiliência", "aprendizado"]
                }
            ]
        },
        "behavioral": {
            "Tecnologia": [
                {
                    "text": "Fale sobre uma situação em que você teve que lidar com um conflito na equipe.",
                    "type": "comportamental",
                    "context": "Foque em como você mediou e resolveu a situação.",
                    "focus": ["comunicação", "trabalho em equipe"]
                },
                {
                    "text": "Como você lida com feedback crítico sobre seu trabalho?",
                    "type": "comportamental",
                    "context": "Seja honesto sobre como você processa e aplica feedback.",
                    "focus": ["crescimento", "resiliência"]
                },
                {
                    "text": "Descreva um projeto em que você precisou influenciar outros sem autoridade formal.",
                    "type": "comportamental",
                    "context": "Mostre suas habilidades de persuasão e liderança.",
                    "focus": ["influência", "liderança"]
                }
            ]
        },
        "pressure": {
            "Tecnologia": [
                {
                    "text": "Você tem 5 minutos para explicar por que deveríamos te contratar. Vamos!",
                    "type": "situacional",
                    "context": "Seja direto, confiante e impactante.",
                    "focus": ["rapidez", "impacto"]
                },
                {
                    "text": "Seu sistema acabou de cair em produção. O que você faz AGORA?",
                    "type": "situacional",
                    "context": "Mostre calma, método e priorização.",
                    "focus": ["crise", "priorização"]
                },
                {
                    "text": "Por que você é melhor que os outros candidatos para esta vaga?",
                    "type": "comportamental",
                    "context": "Seja confiante mas não arrogante. Use evidências.",
                    "focus": ["diferenciação", "confiança"]
                }
            ]
        },
        "company": {
            "Tecnologia": [
                {
                    "text": "Por que você quer trabalhar especificamente nesta empresa?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisou sobre a empresa e cultura.",
                    "focus": ["pesquisa", "fit cultural"]
                },
                {
                    "text": "Como suas habilidades contribuiriam para os objetivos da empresa?",
                    "type": "situacional",
                    "context": "Conecte sua experiência com as necessidades da empresa.",
                    "focus": ["contribuição", "estratégia"]
                },
                {
                    "text": "Que tipo de ambiente de trabalho te faz mais produtivo?",
                    "type": "comportamental",
                    "context": "Seja honesto sobre seu estilo ideal de trabalho.",
                    "focus": ["cultura", "produtividade"]
                }
            ]
        }
    }
    
    # Selecionar banco baseado no modo
    mode_questions = question_banks.get(mode, question_banks["warmup"])
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
        challenging_questions = [
            {
                "text": "Qual seria a arquitetura que você proporia para um sistema com 1M de usuários?",
                "type": "tecnica",
                "context": "Pense em escalabilidade, performance e custos.",
                "focus": ["arquitetura", "escalabilidade"]
            }
        ]
        sector_questions.extend(challenging_questions[:1])
    
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
    from backend.llm_core import analyze_interview_gemini
    
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


@app.get("/api/interview/questions/{cv_analysis_id}")
def get_interview_questions(cv_analysis_id: str) -> JSONResponse:
    """
    Gera perguntas personalizadas baseadas na análise do CV.
    """
    import sentry_sdk
    
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
