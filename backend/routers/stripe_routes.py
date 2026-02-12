"""
Endpoints de pagamento Stripe (checkout, verify, activate, portal, webhook).
CRÍTICO: Alterações aqui devem ser testadas com fluxo completo de pagamento.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any

import sentry_sdk
import stripe
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from dependencies import (
    supabase_admin,
    PRICING,
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD,
    STRIPE_PRICE_ID_TRIAL,
    FRONTEND_CHECKOUT_RETURN_URL,
    _entitlements_status,
    _create_fallback_subscription,
    ActivateEntitlementsRequest,
    StripeCreateCheckoutSessionRequest,
    StripeVerifyCheckoutSessionRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["stripe"])


@router.post("/stripe/create-checkout-session")
def stripe_create_checkout_session(payload: StripeCreateCheckoutSessionRequest) -> JSONResponse:
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

    # Block subscription purchase if user already has an active subscription
    if is_subscription and payload.client_reference_id and supabase_admin:
        try:
            existing_sub = (
                supabase_admin.table("subscriptions")
                .select("subscription_plan,subscription_status")
                .eq("user_id", payload.client_reference_id)
                .in_("subscription_status", ["active", "trialing"])
                .limit(1)
                .execute()
            )
            if existing_sub.data:
                current_plan = existing_sub.data[0].get("subscription_plan", "")
                logger.info(f"[Checkout] Bloqueado: usuário já tem assinatura ativa ({current_plan})")
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": f"Você já possui uma assinatura ativa ({current_plan}). Para comprar mais créditos, escolha um pacote avulso.",
                        "code": "ACTIVE_SUBSCRIPTION_EXISTS",
                        "current_plan": current_plan,
                    }
                )
        except Exception as check_err:
            logger.warning(f"[Checkout] Subscription check failed (non-fatal): {check_err}")

    try:
        # Resolve customer: use existing Stripe customer ID if available, otherwise use email
        customer_kwargs: dict[str, Any] = {}
        existing_customer_id = None
        
        if payload.client_reference_id and supabase_admin:
            try:
                subs = (
                    supabase_admin.table("subscriptions")
                    .select("stripe_customer_id")
                    .eq("user_id", payload.client_reference_id)
                    .order("current_period_end", desc=True)
                    .limit(1)
                    .execute()
                )
                if subs.data and subs.data[0].get("stripe_customer_id"):
                    existing_customer_id = subs.data[0]["stripe_customer_id"]
                    logger.info(f"[Checkout] Existing Stripe customer found: {existing_customer_id}")
            except Exception as lookup_err:
                logger.warning(f"[Checkout] Customer lookup failed (non-fatal): {lookup_err}")
        
        if existing_customer_id:
            customer_kwargs["customer"] = existing_customer_id
        elif payload.customer_email:
            customer_kwargs["customer_email"] = payload.customer_email

        # Configuração especial para Paid Trial (R$ 1,99 hoje + 7 dias trial + R$ 19,90/mês depois)
        if plan_id == "trial":
            subscription_price_id = STRIPE_PRICE_ID_TRIAL
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
                        "price": setup_fee_price_id,
                        "quantity": 1,
                    },
                ],
                subscription_data={
                    "trial_period_days": 7,
                },
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                **customer_kwargs,
                client_reference_id=payload.client_reference_id,
                metadata={
                    "plan": plan_id,
                    "score": str(int(payload.score or 0)),
                    "setup_fee": "1.99",
                },
            )
        else:
            session = stripe.checkout.Session.create(
                mode="subscription" if is_subscription else "payment",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                **customer_kwargs,
                client_reference_id=payload.client_reference_id,
                metadata={
                    "plan": plan_id,
                    "score": str(int(payload.score or 0)),
                },
            )
        return JSONResponse(content={"id": session.get("id"), "url": session.get("url")})
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ [Checkout] Stripe error: {type(e).__name__}: {e}")
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.post("/stripe/verify-checkout-session")
def stripe_verify_checkout_session(payload: StripeVerifyCheckoutSessionRequest) -> JSONResponse:
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


@router.post("/entitlements/activate")
def activate_entitlements(payload: ActivateEntitlementsRequest) -> JSONResponse:
    sentry_sdk.set_tag("endpoint", "entitlements_activate")
    sentry_sdk.set_context("user", {"id": payload.user_id})
    
    logger.info(f"[ACTIVATE] Iniciando ativação: session_id={payload.session_id}, user_id={payload.user_id}")
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Banco não configurado"})

    # 1. Buscar sessão do Stripe
    try:
        logger.info(f"[ACTIVATE] Buscando sessão Stripe: {payload.session_id}")
        session = stripe.checkout.Session.retrieve(payload.session_id)
        logger.info(f"[ACTIVATE] Sessão encontrada com sucesso")
    except Exception as e:
        logger.error(f"[ACTIVATE] Erro ao buscar sessão: {e}")
        return JSONResponse(status_code=400, content={"error": "Sessão inválida"})
    
    # 2. Extrair dados necessários
    user_id = payload.user_id
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    plan_id = session.get("metadata", {}).get("plan", "basico")
    payment_status = session.get("payment_status")
    
    logger.info(f"[ACTIVATE] Dados extraídos:")
    logger.info(f"  - user_id: {user_id}")
    logger.info(f"  - subscription_id: {subscription_id}")
    logger.info(f"  - customer_id: {customer_id}")
    logger.info(f"  - plan_id: {plan_id}")
    logger.info(f"  - payment_status: {payment_status}")
    
    # 3. Validar pagamento
    if payment_status not in ("paid", "no_payment_required", "unpaid"):
        logger.error(f"[ACTIVATE] Pagamento não confirmado: {payment_status}")
        return JSONResponse(status_code=400, content={"error": "Pagamento não confirmado"})
    
    # 4. Determinar tipo de ativação
    if subscription_id:
        logger.info(f"[ACTIVATE] Ativando assinatura (subscription_id existe)")
        activation_type = "subscription"
    else:
        logger.info(f"[ACTIVATE] Ativando créditos avulsos (sem subscription_id)")
        activation_type = "one_time"
    
    # 5. Buscar dados do plano
    if plan_id not in PRICING:
        plan_id = "basico"
        logger.warning(f"[ACTIVATE] Plano não encontrado, usando basico")
    
    plan = PRICING[plan_id]
    credits = plan.get("credits", 30)
    
    # 6. Buscar dados da assinatura se existir
    stripe_status = None
    period_start = None
    period_end = None
    
    if subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            stripe_status = sub.get("status")
            cps = int(sub.get("current_period_start", 0))
            cpe = int(sub.get("current_period_end", 0))
            
            # Converter timestamps
            if cps > 1000000000000:
                cps = cps // 1000
            if cpe > 1000000000000:
                cpe = cpe // 1000
                
            period_start = datetime.fromtimestamp(cps).isoformat()
            period_end = datetime.fromtimestamp(cpe).isoformat()
            
            logger.info(f"[ACTIVATE] Dados da assinatura Stripe: status={stripe_status}")
        except Exception as e:
            logger.error(f"[ACTIVATE] Erro ao buscar assinatura: {e}")
            stripe_status = "active"  # fallback
    
    # 7. Ativar créditos de acordo com o tipo de compra
    try:
        if activation_type == "one_time":
            # COMPRA AVULSA: Adicionar créditos à tabela user_credits SEM destruir assinatura existente
            logger.info(f"[ACTIVATE] Compra avulsa: adicionando {credits} créditos para user={user_id}")
            
            existing = (
                supabase_admin.table("user_credits")
                .select("balance")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            existing_row = (existing.data or [])[0] if existing.data else None
            
            if existing_row:
                new_balance = int(existing_row.get("balance", 0)) + credits
                logger.info(f"[ACTIVATE] Créditos existentes: {existing_row.get('balance', 0)}, novo saldo: {new_balance}")
                supabase_admin.table("user_credits").update(
                    {"balance": new_balance}
                ).eq("user_id", user_id).execute()
            else:
                logger.info(f"[ACTIVATE] Sem créditos avulsos anteriores, criando registro com {credits}")
                supabase_admin.table("user_credits").insert(
                    {"user_id": user_id, "balance": credits}
                ).execute()
            
            # Calcular total de créditos (assinatura + avulsos) para retornar ao frontend
            status = _entitlements_status(user_id)
            total_credits = status.get("credits_remaining", credits)
            
            logger.info(f"[ACTIVATE] Créditos avulsos ativados. Total disponível: {total_credits}")
            
            return JSONResponse(content={
                "ok": True,
                "plan_id": plan_id,
                "credits_remaining": total_credits,
                "activation_type": activation_type
            })
        else:
            # ASSINATURA: Usar RPC que cria/substitui assinatura e usage
            logger.info(f"[ACTIVATE] Assinatura: chamando RPC para user={user_id}")
            
            rpc_params = {
                "p_user_id": user_id,
                "p_stripe_sub_id": subscription_id,
                "p_stripe_cust_id": customer_id or f"cus_{user_id[:8]}",
                "p_plan": plan_id,
                "p_status": stripe_status or "active",
                "p_start": period_start or datetime.now().isoformat(),
                "p_end": period_end or (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            logger.info(f"[ACTIVATE] Chamando RPC com parâmetros: {rpc_params}")
            
            response = supabase_admin.rpc("activate_subscription_rpc", rpc_params).execute()
            
            logger.info(f"[ACTIVATE] RPC executada com sucesso. Retorno: {response.data}")
            
            return JSONResponse(content={
                "ok": True,
                "plan_id": plan_id,
                "credits_remaining": credits,
                "activation_type": activation_type
            })
        
    except Exception as e:
        logger.error(f"[ACTIVATE] Erro na ativação: {e}")
        return JSONResponse(status_code=500, content={"error": f"Erro na ativação: {str(e)}"})


@router.post("/stripe/create-portal-session")
def create_customer_portal_session(payload: dict) -> JSONResponse:
    """Cria uma sessão do Stripe Customer Portal para gerenciamento de assinatura."""
    sentry_sdk.set_tag("endpoint", "stripe_create_portal_session")
    
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado"})
    
    user_id = payload.get("user_id")
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "user_id é obrigatório"})
    
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})
    
    try:
        # Buscar assinatura ativa do usuário (inclui trialing e active)
        subs = (
            supabase_admin.table("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user_id)
            .in_("subscription_status", ["trialing", "active"])
            .order("current_period_end", desc=True)
            .limit(1)
            .execute()
        )
        
        if not subs.data:
            return JSONResponse(status_code=404, content={"error": "Nenhuma assinatura ativa encontrada"})
        
        subscription = subs.data[0]
        customer_id = subscription.get("stripe_customer_id")
        
        if not customer_id:
            return JSONResponse(status_code=400, content={"error": "ID do cliente Stripe não encontrado"})
        
        # Criar sessão do portal
        return_url = f"{FRONTEND_CHECKOUT_RETURN_URL}?portal=success&message=Gerenciamento+concluido"
        
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            
            print(f"[DEBUG] Portal session criada: {portal_session.id}")
            print(f"[DEBUG] Portal URL: {portal_session.url}")
            
            return JSONResponse(content={"portal_url": portal_session.url})
            
        except Exception as portal_error:
            print(f"[DEBUG] Erro ao criar portal session: {portal_error}")
            return JSONResponse(status_code=500, content={"error": f"Erro ao criar portal: {str(portal_error)}"})
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao criar portal session: {e}")
        return JSONResponse(status_code=500, content={"error": f"Erro ao criar portal: {str(e)}"})


@router.get("/pricing")
def get_pricing() -> JSONResponse:
    """Retorna informações de pricing para o frontend."""
    pricing_info = {}
    for plan_id, plan_data in PRICING.items():
        pricing_info[plan_id] = {
            "name": plan_data.get("name"),
            "price": plan_data.get("price"),
            "billing": plan_data.get("billing"),
            "features": plan_data.get("features", []),
        }
    return JSONResponse(content=pricing_info)


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """
    Webhook do Stripe para garantir ativação de créditos independente do frontend.
    CRÍTICO: Evita perda de pagamentos se usuário fechar navegador.
    """
    sentry_sdk.set_tag("endpoint", "stripe_webhook")
    
    # 1. Verificar se webhook secret está configurado
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("❌ STRIPE_WEBHOOK_SECRET não configurado")
        return JSONResponse(
            status_code=500,
            content={"error": "Webhook não configurado"}
        )
    
    # 2. Ler payload
    body = await request.body()
    signature_header = request.headers.get("stripe-signature")
    
    if not signature_header:
        logger.error("❌ Stripe signature header ausente")
        return JSONResponse(
            status_code=400,
            content={"error": "Assinatura ausente"}
        )
    
    # 3. Verificar assinatura
    try:
        from stripe_webhooks import verify_webhook_signature
        if not verify_webhook_signature(body, signature_header):
            logger.error("❌ Assinatura do webhook inválida")
            return JSONResponse(
                status_code=401,
                content={"error": "Assinatura inválida"}
            )
    except Exception as e:
        logger.error(f"❌ Erro ao verificar assinatura: {e}")
        return JSONResponse(
            status_code=401,
            content={"error": "Erro na verificação"}
        )
    
    # 4. Processar evento
    try:
        event = json.loads(body)
        event_type = event.get("type")
        event_data = event.get("data", {})
        
        logger.info(f"🔥 [WEBHOOK] Recebido evento: {event_type}")
        
        from stripe_webhooks import process_webhook_event
        
        result = process_webhook_event(event_type, event_data)
        
        if result["success"]:
            logger.info(f"✅ [WEBHOOK] {result['message']}")
            return JSONResponse(content=result)
        else:
            logger.error(f"❌ [WEBHOOK] {result['message']}")
            return JSONResponse(
                status_code=400,
                content=result
            )
            
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON inválido no webhook: {e}")
        return JSONResponse(
            status_code=400,
            content={"error": "JSON inválido"}
        )
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro crítico no webhook: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Erro interno"}
        )
