"""
Endpoints administrativos (cache stats, monitoring).
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

import sentry_sdk
import stripe
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from dependencies import (
    supabase_admin,
    STRIPE_SECRET_KEY,
    STRIPE_MODE,
    DEBUG_API_SECRET,
    PRICING,
    _entitlements_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stripe-mode")
def get_stripe_mode() -> JSONResponse:
    """Diagnóstico: mostra qual modo do Stripe está ativo."""
    key_prefix = (STRIPE_SECRET_KEY or "")[:7]
    test_key_raw = os.getenv("STRIPE_TEST_SECRET_KEY", "")
    return JSONResponse(content={
        "stripe_mode": STRIPE_MODE,
        "key_type": "test" if key_prefix.startswith("sk_test") else "live" if key_prefix.startswith("sk_live") else "unknown",
        "key_prefix": key_prefix + "...",
        "test_key_exists": bool(test_key_raw),
        "test_key_prefix": (test_key_raw[:7] + "...") if test_key_raw else "EMPTY",
    })


@router.post("/force-activate")
def force_activate(request: Request, payload: dict) -> JSONResponse:
    """
    Admin endpoint para ativar manualmente a assinatura de um usuário.
    Busca a última sessão de checkout paga no Stripe e ativa.
    Requer header X-Admin-Secret.
    """
    admin_secret = request.headers.get("X-Admin-Secret", "")
    if admin_secret != DEBUG_API_SECRET:
        return JSONResponse(status_code=403, content={"error": "Acesso negado"})

    user_id = payload.get("user_id")
    email = payload.get("email")
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "user_id é obrigatório"})

    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado"})

    try:
        stripe.api_key = STRIPE_SECRET_KEY

        # Buscar sessões de checkout recentes por email
        sessions = stripe.checkout.Session.list(
            limit=10,
            **({"customer_details": {"email": email}} if email else {})
        )

        # Encontrar a sessão mais recente que está completa
        target_session = None
        for s in sessions.data:
            meta = s.get("metadata", {})
            ref_id = s.get("client_reference_id", "")
            if (ref_id == user_id or meta.get("user_id") == user_id) and s.get("status") == "complete":
                target_session = s
                break

        # Se não encontrou por user_id, pegar a mais recente completa
        if not target_session:
            for s in sessions.data:
                if s.get("status") == "complete":
                    target_session = s
                    break

        if not target_session:
            return JSONResponse(status_code=404, content={"error": "Nenhuma sessão de checkout encontrada"})

        session_id = target_session.id
        subscription_id = target_session.get("subscription")
        customer_id = target_session.get("customer")
        plan_id = target_session.get("metadata", {}).get("plan", "trial")

        if plan_id not in PRICING:
            plan_id = "trial"

        plan = PRICING[plan_id]
        credits = plan.get("credits", 30)

        if subscription_id:
            # Ativar assinatura
            try:
                sub = stripe.Subscription.retrieve(subscription_id)
                stripe_status = sub.get("status", "active")
                cps = int(sub.get("current_period_start", 0))
                cpe = int(sub.get("current_period_end", 0))
                if cps > 1000000000000:
                    cps = cps // 1000
                if cpe > 1000000000000:
                    cpe = cpe // 1000
                period_start = datetime.fromtimestamp(cps).isoformat() if cps else datetime.now().isoformat()
                period_end = datetime.fromtimestamp(cpe).isoformat() if cpe else (datetime.now() + timedelta(days=30)).isoformat()
            except Exception:
                stripe_status = "active"
                period_start = datetime.now().isoformat()
                period_end = (datetime.now() + timedelta(days=30)).isoformat()

            rpc_params = {
                "p_user_id": user_id,
                "p_stripe_sub_id": subscription_id,
                "p_stripe_cust_id": customer_id or f"cus_{user_id[:8]}",
                "p_plan": plan_id,
                "p_status": stripe_status,
                "p_start": period_start,
                "p_end": period_end,
            }
            supabase_admin.rpc("activate_subscription_rpc", rpc_params).execute()
        else:
            # Compra avulsa
            existing = supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
            existing_row = (existing.data or [])[0] if existing.data else None
            if existing_row:
                new_balance = int(existing_row.get("balance", 0)) + credits
                supabase_admin.table("user_credits").update({"balance": new_balance}).eq("user_id", user_id).execute()
            else:
                supabase_admin.table("user_credits").insert({"user_id": user_id, "balance": credits}).execute()

        status = _entitlements_status(user_id)

        return JSONResponse(content={
            "ok": True,
            "session_id": session_id,
            "plan_id": plan_id,
            "subscription_id": subscription_id,
            "credits_remaining": status.get("credits_remaining", credits),
            "activation_type": "subscription" if subscription_id else "one_time",
        })

    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"[ADMIN] Erro no force-activate: {e}")
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.get("/cache-stats")
def get_cache_stats() -> JSONResponse:
    """
    Endpoint de admin para monitorar estatísticas do cache.
    Retorna dados sobre áreas populares para análise de pre-warming.
    """
    sentry_sdk.set_tag("endpoint", "admin_cache_stats")
    
    try:
        from cache_manager import CacheManager
        
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
