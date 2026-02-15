"""
Módulo centralizado de dependências compartilhadas.
Todos os routers importam daqui para evitar imports circulares e duplicação.
"""
from __future__ import annotations

import io
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, List

import sentry_sdk
import stripe
from fastapi import File, Form, UploadFile, Request, HTTPException, Header
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from supabase import create_client, Client

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# ============================================================
# ENVIRONMENT & CONFIG
# ============================================================

try:
    from config import settings, IS_DEV, IS_PROD, validate_critical_settings
    if settings:
        missing_vars = validate_critical_settings()
        if missing_vars:
            raise RuntimeError(f"Variáveis críticas faltando no .env.local: {', '.join(missing_vars)}")
except ImportError:
    settings = None
    IS_DEV = os.getenv("ENVIRONMENT", "development") == "development"
    IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
ALLOW_DEBUG_ENDPOINTS = os.getenv("ALLOW_DEBUG_ENDPOINTS", "false").lower() == "true"

# ============================================================
# STRIPE CONFIG
# ============================================================

if settings and IS_DEV:
    STRIPE_SECRET_KEY = settings.STRIPE_SECRET_KEY
    SUPABASE_URL = settings.SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY
    DEBUG_API_SECRET = settings.DEBUG_API_SECRET
    GOOGLE_API_KEY = settings.GOOGLE_API_KEY
    GROQ_API_KEY = settings.GROQ_API_KEY
    FRONTEND_CHECKOUT_RETURN_URL = settings.FRONTEND_CHECKOUT_RETURN_URL
    STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD = settings.STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD
    STRIPE_PRICE_ID_PRO_MONTHLY = settings.STRIPE_PRICE_ID_PRO_MONTHLY
    STRIPE_PRICE_ID_PRO_ANNUAL = settings.STRIPE_PRICE_ID_PRO_ANNUAL
    STRIPE_PRICE_ID_TRIAL = settings.STRIPE_PRICE_ID_TRIAL
    STRIPE_PRICE_ID_CREDIT_1 = settings.STRIPE_PRICE_ID_CREDIT_1
    STRIPE_PRICE_ID_CREDIT_3 = settings.STRIPE_PRICE_ID_CREDIT_3
    STRIPE_PRICE_ID_CREDIT_5 = settings.STRIPE_PRICE_ID_CREDIT_5
else:
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    DEBUG_API_SECRET = os.getenv("DEBUG_API_SECRET", "vant_debug_2026_secure_key")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    FRONTEND_CHECKOUT_RETURN_URL = os.getenv("FRONTEND_CHECKOUT_RETURN_URL") or "http://localhost:3000/app"
    STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD")
    STRIPE_PRICE_ID_PRO_MONTHLY = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY")
    STRIPE_PRICE_ID_PRO_ANNUAL = os.getenv("STRIPE_PRICE_ID_PRO_ANNUAL")
    STRIPE_PRICE_ID_TRIAL = os.getenv("STRIPE_PRICE_ID_TRIAL")
    STRIPE_PRICE_ID_CREDIT_1 = os.getenv("STRIPE_PRICE_ID_CREDIT_1")
    STRIPE_PRICE_ID_CREDIT_3 = os.getenv("STRIPE_PRICE_ID_CREDIT_3")
    STRIPE_PRICE_ID_CREDIT_5 = os.getenv("STRIPE_PRICE_ID_CREDIT_5")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# ============================================================
# SUPABASE CLIENT (SINGLETON)
# ============================================================

supabase_admin: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ============================================================
# PRICING (SINGLE SOURCE OF TRUTH)
# ============================================================

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
        "credits": 30,
        "billing": "trial",
        "trial_days": 7,
        "converts_to": "pro_monthly_early_bird",
        "features": [
            "Teste PRO por 7 dias - apenas R$ 1,99",
            "30 otimizações para testar",
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

# ============================================================
# SHARED HELPERS
# ============================================================

def validate_user_id(user_id: str) -> bool:
    """Valida se user_id é um UUID válido."""
    if not user_id:
        return False
    try:
        uuid.UUID(user_id)
        return True
    except (ValueError, AttributeError):
        return False


def verify_debug_access(x_debug_secret: str = Header(None, description="Debug API secret key")) -> bool:
    """
    Verifica se o request tem permissão para acessar endpoints de debug.
    
    Raises:
        HTTPException: Se não tiver permissão (403 Forbidden)
    """
    # Em produção, endpoints de debug são bloqueados por padrão
    if not ALLOW_DEBUG_ENDPOINTS and os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(
            status_code=403,
            detail="Debug endpoints are disabled in production"
        )
    
    # Verificar chave secreta
    if not x_debug_secret or x_debug_secret != DEBUG_API_SECRET:
        raise HTTPException(
            status_code=403,
            detail="Invalid debug secret. Use X-Debug-Secret header."
        )
    
    return True


def log_debug_access(endpoint: str, user_id: str = None):
    """Registra acesso aos endpoints de debug para auditoria."""
    sentry_sdk.set_tag("debug_endpoint", endpoint)
    sentry_sdk.set_tag("debug_access", "authorized")
    
    if user_id:
        sentry_sdk.set_context("debug_user", {"user_id": user_id})
    
    logger.warning(f"🔧 DEBUG ENDPOINT ACCESS: {endpoint} by user_id={user_id or 'unknown'}")


def _upload_to_bytes_io(upload: UploadFile) -> io.BytesIO:
    b = upload.file.read()
    return io.BytesIO(b)


def _entitlements_status(user_id: str) -> dict[str, Any]:
    """Verifica status de entitlements do usuário (assinatura + avulsos combinados)."""
    print(f'[DEBUG] Buscando subs para user {user_id}')
    
    subscription_credits = 0
    has_subscription = False
    
    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [])[0] if subs.data else None
    
    print(f"[DEBUG] _entitlements_status: user_id={user_id}, subscription={sub}")

    # Verificar se tem assinatura ativa (qualquer plano)
    if sub and sub.get("subscription_status") in ["active", "trialing"]:
        plan_name = sub.get("subscription_plan")
        period_start = sub.get("current_period_start")
        
        print(f"[DEBUG] Assinatura ativa encontrada: plan={plan_name}, status={sub.get('subscription_status')}")
        
        # Todos os planos de assinatura (PRO, Trial, pro_monthly_early_bird) usam sistema de usage com limite mensal
        if plan_name in ["pro_monthly", "pro_annual", "trial", "pro_monthly_early_bird"]:
            has_subscription = True
            usage = (
                supabase_admin.table("usage")
                .select("used,usage_limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [])[0] if usage.data else None
            used = int(row.get('used', 0) if row else 0)
            limit_val = int(row.get('usage_limit', 30) if row else 30)
            subscription_credits = max(0, limit_val - used)
            print(f"[DEBUG] Créditos da assinatura: {subscription_credits} (used={used}, limit={limit_val})")

    # Verificar créditos avulsos (sempre, mesmo com assinatura)
    avulso_credits = 0
    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [])[0] if credits.data else None
    
    if row is not None:
        avulso_credits = max(0, int(row.get("balance", 0)))
    
    print(f"[DEBUG] Créditos avulsos: {avulso_credits}")
    
    # Total = assinatura + avulsos
    total_credits = subscription_credits + avulso_credits
    
    print(f"[DEBUG] Total de créditos: {total_credits} (assinatura={subscription_credits} + avulsos={avulso_credits})")
    
    return {
        "payment_verified": total_credits > 0,
        "credits_remaining": total_credits,
        "plan": "pro_monthly_early_bird" if has_subscription else None,
    }


def _consume_one_credit(user_id: str) -> None:
    if not supabase_admin or not user_id:
        raise RuntimeError("Banco não configurado")

    consumed_from_subscription = False

    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [])[0] if subs.data else None
    
    # Todos os planos de assinatura (PRO, Trial, pro_monthly_early_bird) consomem do sistema de usage
    if sub and sub.get("subscription_status") in ["active", "trialing"]:
        plan_name = sub.get("subscription_plan")
        if plan_name in ["pro_monthly", "pro_annual", "trial", "pro_monthly_early_bird"]:
            period_start = sub.get("current_period_start")
            usage = (
                supabase_admin.table("usage")
                .select("used,usage_limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [])[0] if usage.data else None
            used = int(row.get('used', 0) if row else 0)
            limit_val = int(row.get('usage_limit', 30) if row else 30)
            
            if used < limit_val:
                # Ainda tem créditos na assinatura, consumir daqui
                if row is None:
                    supabase_admin.table("usage").insert(
                        {"user_id": user_id, "period_start": period_start, "used": 1, "usage_limit": limit_val}
                    ).execute()
                else:
                    supabase_admin.table("usage").update({"used": used + 1}).eq("user_id", user_id).eq(
                        "period_start", period_start
                    ).execute()
                consumed_from_subscription = True
            # Se used >= limit_val, NÃO levantar erro - cair para créditos avulsos abaixo

    if consumed_from_subscription:
        return

    # Consumir de créditos avulsos (fallback quando assinatura esgotada ou inexistente)
    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [])[0] if credits.data else None
    
    if row is None:
        raise RuntimeError("Sem créditos")
    
    balance = int(row.get("balance", 0))
    if balance <= 0:
        raise RuntimeError("Sem créditos")
    supabase_admin.table("user_credits").update({"balance": balance - 1}).eq("user_id", user_id).execute()


def _create_fallback_subscription(payload: ActivateEntitlementsRequest, plan_id: str, plan: dict) -> JSONResponse:
    """Função fallback forçada para garantir que usuário receba créditos."""
    print(f"[FALLBACK] Criando assinatura manual forçada para user {payload.user_id}")
    
    try:
        now = datetime.now()
        period_start_iso = now.isoformat()
        period_end_iso = (now + timedelta(days=30)).isoformat()
        
        # Criar assinatura manual forçada
        subscription_data = {
            "user_id": payload.user_id,
            "subscription_plan": plan_id,
            "stripe_subscription_id": f"fallback_manual_{payload.user_id[:8]}_{int(now.timestamp())}",
            "stripe_customer_id": f"cus_fallback_{payload.user_id[:8]}",
            "subscription_status": "trialing",
            "current_period_start": period_start_iso,
            "current_period_end": period_end_iso,
        }
        
        # Forçar inserção da assinatura
        result = supabase_admin.table("subscriptions").insert(subscription_data).execute()
        print(f"[FALLBACK] Assinatura forçada criada: {result}")
        
        # Forçar criação do usage
        usage_data = {
            "user_id": payload.user_id,
            "period_start": period_start_iso,
            "used": 0,
            "usage_limit": int(plan.get("credits", 30))
        }
        
        usage_result = supabase_admin.table("usage").insert(usage_data).execute()
        print(f"[FALLBACK] Usage forçado criado: {usage_result}")
        
        credits_remaining = int(plan.get("credits", 30))
        
        print(f"[FALLBACK] SUCESSO: Usuário {payload.user_id} recebeu {credits_remaining} créditos forçados")
        
        return JSONResponse(content={
            "ok": True,
            "message": "Assinatura forçada criada (fallback)",
            "credits": credits_remaining,
            "plan": plan_id,
            "fallback": True
        })
        
    except Exception as e:
        logger.error(f"[ERRO CRÍTICO] Falha total no fallback: {e}")
        print(f"[ERRO CRÍTICO] Falha total no fallback: {e}")
        
        # ÚLTIMO RECURSO: Retornar sucesso mesmo sem salvar no banco
        print(f"[ÚLTIMO RECURSO] Retornando sucesso sem salvar no banco...")
        return JSONResponse(content={
            "ok": True,
            "message": "Créditos liberados (último recurso)",
            "credits": int(plan.get("credits", 30)),
            "plan": plan_id,
            "emergency": True
        })


# ============================================================
# PYDANTIC MODELS (shared across routers)
# ============================================================

def _process_analysis_background(
    session_id: str,
    user_id: str,
    file_bytes: bytes | None,
    job_description: str,
    area_of_interest: str,
    competitors_bytes: list[bytes] | None = None,
    filename: str = None,
    cv_text_preextracted: str | None = None
) -> None:
    """
    Função background para processamento assíncrono da análise.
    Usa orquestrador streaming com progressive loading.
    """
    sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("background_task", "process_analysis")
    
    try:
        # Importar orquestrador streaming
        from llm_core import analyze_cv_orchestrator_streaming
        from logic import extrair_texto_pdf
        
        # Etapa 1: Extrair texto do PDF (ou usar texto pré-extraído)
        if cv_text_preextracted and len(cv_text_preextracted.strip()) >= 100:
            cv_text = cv_text_preextracted
            logger.info(f"♻️ Usando cv_text pré-extraído para sessão {session_id} ({len(cv_text)} chars)")
        elif file_bytes:
            logger.info(f"🔍 Extraindo texto do PDF para sessão {session_id}")
            cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        else:
            cv_text = None
        
        if not cv_text or len(cv_text.strip()) < 100:
            logger.error(f"❌ PDF vazio ou muito pequeno para sessão {session_id}")
            from llm_core import update_session_progress
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
            competitors_text=competitors_text,
            user_id=user_id,
            original_filename=filename
        )
        
        logger.info(f"✅ Orquestrador concluído para sessão {session_id}")
        
    except Exception as e:
        logger.error(f"❌ Erro fatal no background task {session_id}: {e}")
        sentry_sdk.capture_exception(e)
        
        # Atualizar status para falha
        try:
            from llm_core import update_session_progress
            error_data = {
                "error": f"Erro fatal no processamento: {str(e)}",
                "error_type": type(e).__name__
            }
            update_session_progress(session_id, error_data, "failed")
        except Exception as update_error:
            logger.error(f"❌ Erro ao atualizar status para failed: {update_error}")


# ============================================================
# PYDANTIC MODELS (shared across routers)
# ============================================================

class ActivateEntitlementsRequest(BaseModel):
    session_id: str
    user_id: str
    plan_id: str


class StripeCreateCheckoutSessionRequest(BaseModel):
    plan_id: str
    customer_email: str | None = None
    client_reference_id: str | None = None
    score: int | None = None


class StripeVerifyCheckoutSessionRequest(BaseModel):
    session_id: str
