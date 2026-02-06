"""
Debug endpoints — somente acessíveis com X-Debug-Secret header.
Bloqueados em produção por padrão.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import stripe
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from dependencies import (
    supabase_admin,
    verify_debug_access,
    log_debug_access,
    _entitlements_status,
)

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.post("/create-real-customer")
def create_real_customer(payload: dict, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Cria um customer real no Stripe e atualiza o banco."""
    verify_debug_access(x_debug_secret)
    log_debug_access("create-real-customer", payload.get("user_id"))
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    user_id = payload.get("user_id")
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "user_id obrigatório"})
    
    try:
        user_data = supabase_admin.auth.admin.get_user_by_id(user_id)
        user_email = user_data.user.email if user_data.user else None
        
        if not user_email:
            return JSONResponse(status_code=400, content={"error": "Email do usuário não encontrado"})
        
        print(f"[DEBUG] Criando customer para email: {user_email}")
        
        customer = stripe.Customer.create(
            email=user_email,
            metadata={"user_id": user_id}
        )
        
        print(f"[DEBUG] Customer criado: {customer.id}")
        
        supabase_admin.table("subscriptions").update(
            {"stripe_customer_id": customer.id}
        ).eq("user_id", user_id).execute()
        
        print(f"[DEBUG] Assinatura atualizada com customer_id real: {customer.id}")
        
        return JSONResponse(content={
            "ok": True,
            "message": "Customer real criado e assinatura atualizada",
            "customer_id": customer.id,
            "email": user_email
        })
        
    except Exception as e:
        print(f"[ERROR] create_real_customer: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/find-user-by-email")
def find_user_by_email(email: str, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Busca usuário por email no Supabase."""
    verify_debug_access(x_debug_secret)
    log_debug_access("find-user-by-email")
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    try:
        users = supabase_admin.table("auth.users").select("id, email, created_at").eq("email", email).execute()
        
        print(f"[DEBUG] Users encontrados: {users.data}")
        
        if users.data:
            user = users.data[0]
            print(f"[DEBUG] Usuário encontrado: {user['id']}")
            
            subs = (
                supabase_admin.table("subscriptions")
                .select("*")
                .eq("user_id", user["id"])
                .limit(1)
                .execute()
            )
            
            subscription_data = None
            if subs.data:
                subscription_data = subs.data[0]
            
            return JSONResponse(content={
                "user_id": user["id"],
                "email": user["email"],
                "created_at": user["created_at"],
                "subscription": subscription_data
            })
        
        return JSONResponse(content={"error": "Usuário não encontrado"})
        
    except Exception as e:
        print(f"[ERROR] find_user_by_email: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/create-supabase-user")
def create_supabase_user(payload: dict, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Cria usuário no banco diretamente para teste."""
    verify_debug_access(x_debug_secret)
    log_debug_access("create-supabase-user", payload.get("user_id"))
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    user_id = payload.get("user_id")
    email = payload.get("email")
    
    if not user_id or not email:
        return JSONResponse(status_code=400, content={"error": "user_id e email obrigatórios"})
    
    try:
        print(f"[DEBUG] Criando usuário no banco: {user_id}")
        
        subscription_data = {
            "user_id": user_id,
            "subscription_plan": "pro_monthly",
            "stripe_subscription_id": f"manual_test_{user_id[:8]}",
            "stripe_customer_id": f"cus_test_{user_id[:8]}",
            "subscription_status": "active",
            "current_period_start": "2026-02-05T21:41:00.000000+00:00",
            "current_period_end": "2026-03-07T21:41:00.000000+00:00",
        }
        
        supabase_admin.table("subscriptions").insert(subscription_data).execute()
        
        period_start = datetime.now()
        
        supabase_admin.table("usage").upsert(
            {"user_id": user_id, "period_start": period_start.isoformat(), "used": 0, "usage_limit": 30}
        ).execute()
        
        print(f"[DEBUG] Assinatura criada para usuário: {user_id}")
        
        return JSONResponse(content={
            "ok": True,
            "user_id": user_id,
            "email": email,
            "message": "Usuário criado com assinatura ativa"
        })
        
    except Exception as e:
        print(f"[ERROR] create_supabase_user: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/activate-by-email")
def activate_by_email_endpoint(payload: dict, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Ativa assinatura para usuário existente pelo email."""
    verify_debug_access(x_debug_secret)
    log_debug_access("activate-by-email")
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    email = payload.get("email")
    plan_id = payload.get("plan_id", "pro_monthly")
    
    if not email:
        return JSONResponse(status_code=400, content={"error": "email obrigatório"})
    
    try:
        print(f"[DEBUG] Buscando usuário: {email}")
        
        users = supabase_admin.auth.admin.list_users()
        
        target_user = None
        for user in users:
            if user.email == email:
                target_user = user
                break
        
        if not target_user:
            return JSONResponse(status_code=404, content={"error": f"Usuário {email} não encontrado"})
        
        print(f"[DEBUG] Usuário encontrado: {target_user.id}")
        
        subs = supabase_admin.table("subscriptions").select("*").eq("user_id", target_user.id).execute()
        
        if subs.data:
            return JSONResponse(content={
                "ok": True,
                "message": "Usuário já tem assinatura",
                "user_id": target_user.id,
                "subscription": subs.data[0]
            })
        
        now = datetime.now()
        
        subscription_data = {
            "user_id": target_user.id,
            "subscription_plan": plan_id,
            "stripe_subscription_id": f"manual_{target_user.id[:8]}",
            "stripe_customer_id": f"cus_manual_{target_user.id[:8]}",
            "subscription_status": "active",
            "current_period_start": now.isoformat(),
            "current_period_end": (now + timedelta(days=30)).isoformat(),
        }
        
        supabase_admin.table("subscriptions").insert(subscription_data).execute()
        print(f"[DEBUG] Assinatura criada")
        
        supabase_admin.table("usage").upsert({
            "user_id": target_user.id,
            "period_start": now.isoformat(),
            "used": 0,
            "usage_limit": 30
        }).execute()
        print(f"[DEBUG] Usage criado")
        
        return JSONResponse(content={
            "ok": True,
            "message": "Assinatura ativada com sucesso",
            "user_id": target_user.id,
            "email": email,
            "plan": plan_id,
            "credits": 30
        })
        
    except Exception as e:
        print(f"[ERROR] activate_by_email_endpoint: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/all-subscriptions")
def get_all_subscriptions(x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Retorna todas as assinaturas do banco."""
    verify_debug_access(x_debug_secret)
    log_debug_access("all-subscriptions")
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    try:
        subs = (
            supabase_admin.table("subscriptions")
            .select("*")
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        
        print(f"[DEBUG] Total de assinaturas: {len(subs.data)}")
        
        subscriptions_with_credits = []
        for sub in subs.data:
            user_id = sub.get("user_id")
            
            status = _entitlements_status(user_id)
            
            sub_with_credits = {
                **sub,
                "credits_remaining": status.get("credits_remaining", 0),
                "has_active_plan": status.get("payment_verified", False)
            }
            subscriptions_with_credits.append(sub_with_credits)
        
        return JSONResponse(content=subscriptions_with_credits)
        
    except Exception as e:
        print(f"[ERROR] get_all_subscriptions: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/check-subscription")
def check_subscription(payload: dict, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Verifica dados da assinatura no banco."""
    verify_debug_access(x_debug_secret)
    log_debug_access("check-subscription", payload.get("user_id"))
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    user_id = payload.get("user_id")
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "user_id obrigatório"})
    
    try:
        subs = (
            supabase_admin.table("subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .order("current_period_end", desc=True)
            .limit(1)
            .execute()
        )
        
        if not subs.data:
            return JSONResponse(content={"error": "Nenhuma assinatura encontrada"})
        
        subscription = subs.data[0]
        print(f"[DEBUG] Assinatura encontrada: {subscription}")
        
        return JSONResponse(content={
            "subscription": subscription,
            "stripe_customer_id": subscription.get("stripe_customer_id"),
            "subscription_plan": subscription.get("subscription_plan"),
            "subscription_status": subscription.get("subscription_status")
        })
        
    except Exception as e:
        print(f"[ERROR] check_subscription: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/manual-activate")
def manual_activate_subscription(payload: dict, x_debug_secret: str = Header(None)) -> JSONResponse:
    """DEBUG: Ativa manualmente uma assinatura para testes."""
    verify_debug_access(x_debug_secret)
    log_debug_access("manual-activate", payload.get("user_id"))
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    user_id = payload.get("user_id")
    plan_id = payload.get("plan_id", "pro_monthly")
    
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "user_id obrigatório"})
    
    try:
        period_start = datetime.now()
        period_end = period_start + timedelta(days=30)
        
        subscription_data = {
            "user_id": user_id,
            "subscription_plan": plan_id,
            "stripe_subscription_id": f"manual_test_{user_id[:8]}",
            "stripe_customer_id": f"cus_test_{user_id[:8]}",
            "subscription_status": "active",
            "current_period_start": period_start.isoformat(),
            "current_period_end": period_end.isoformat(),
        }
        
        existing = (
            supabase_admin.table("subscriptions")
            .select("id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        
        if existing.data:
            supabase_admin.table("subscriptions").update(subscription_data).eq(
                "user_id", user_id
            ).execute()
            print(f"[DEBUG] Assinatura atualizada para usuário {user_id}")
        else:
            supabase_admin.table("subscriptions").insert(subscription_data).execute()
            print(f"[DEBUG] Assinatura criada para usuário {user_id}")
        
        if plan_id in ["pro_monthly", "pro_annual", "trial", "premium_plus"]:
            supabase_admin.table("usage").upsert(
                {"user_id": user_id, "period_start": period_start.isoformat(), "used": 0, "usage_limit": 30}
            ).execute()
            print(f"[DEBUG] Usage criado para usuário {user_id}")
        
        return JSONResponse(content={
            "ok": True,
            "message": "Assinatura ativada manualmente",
            "plan_id": plan_id,
            "credits_remaining": 30
        })
        
    except Exception as e:
        print(f"[ERROR] manual_activate: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/reset-credits")
def reset_credits(payload: dict, x_debug_secret: str = Header(None)):
    """DEBUG ONLY: Reseta créditos do usuário para 3."""
    verify_debug_access(x_debug_secret)
    log_debug_access("reset-credits", payload.get("user_id"))
    
    if not supabase_admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Supabase não configurado")
    user_id = payload.get("user_id")
    if not user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="user_id obrigatório")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": 3}).execute()
    return {"ok": True, "credits": 3}
