"""
Webhooks do Stripe para garantir ativação de créditos independente do frontend.
Implementação crítica para evitar perda de pagamentos.
"""

import logging
import os
import json
import hmac
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
import stripe
from fastapi import Request, HTTPException
from supabase import create_client

from dependencies import (
    supabase_admin,
    PRICING,
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_PRO_MONTHLY,
    STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD,
    STRIPE_PRICE_ID_PRO_ANNUAL,
    STRIPE_PRICE_ID_TRIAL,
    STRIPE_PRICE_ID_CREDIT_1,
    STRIPE_PRICE_ID_CREDIT_3,
    STRIPE_PRICE_ID_CREDIT_5,
)

logger = logging.getLogger(__name__)

# Configuração do Stripe
# STRIPE_SECRET_KEY já importado de dependencies
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")  # Precisa ser configurado

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

def verify_webhook_signature(payload: bytes, signature_header: str) -> bool:
    """
    Verifica se o webhook veio realmente do Stripe.
    """
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("❌ STRIPE_WEBHOOK_SECRET não configurado")
        return False
    
    try:
        # Stripe envia o signature como: "t=timestamp,v1=hash"
        elements = signature_header.split(',')
        
        # Extrair timestamp e hash
        timestamp = None
        expected_hash = None
        
        for element in elements:
            element = element.strip()
            if element.startswith('t='):
                timestamp = element[2:]
            elif element.startswith('v1='):
                expected_hash = element[3:]
        
        if not timestamp or not expected_hash:
            logger.error("❌ Formato de assinatura inválido")
            return False
        
        # Calcular HMAC do payload + timestamp (padrão Stripe)
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        calculated_hash = hmac.new(
            STRIPE_WEBHOOK_SECRET.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Verificar usando constant-time comparison
        return hmac.compare_digest(calculated_hash, expected_hash)
        
    except Exception as e:
        logger.error(f"❌ Erro ao verificar webhook signature: {e}")
        return False


def extract_user_from_metadata(metadata: Dict[str, Any]) -> Optional[str]:
    """
    Extrai user_id dos metadados do evento.
    """
    # Tentar diferentes chaves possíveis
    for key in ["user_id", "userId", "user", "client_reference_id"]:
        if key in metadata:
            return metadata[key]
    
    # Se não encontrar nos metadados, tentar no customer
    if "customer" in metadata:
        customer_id = metadata["customer"]
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return customer.metadata.get("user_id")
        except Exception as e:
            logger.error(f"❌ Erro ao buscar customer {customer_id}: {e}")
    
    return None


def determine_plan_from_price(price_id: str) -> str:
    """
    Determina o plano baseado no price_id do Stripe.
    """
    # Mapeamento reverso dos price_ids
    price_to_plan = {
        STRIPE_PRICE_ID_PRO_MONTHLY: "pro_monthly",
        STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD: "pro_monthly_early_bird",
        STRIPE_PRICE_ID_PRO_ANNUAL: "pro_annual",
        STRIPE_PRICE_ID_TRIAL: "trial",
        STRIPE_PRICE_ID_CREDIT_1: "credit_1",
        STRIPE_PRICE_ID_CREDIT_3: "credit_3",
        STRIPE_PRICE_ID_CREDIT_5: "credit_5",
    }
    
    return price_to_plan.get(price_id, "unknown")


def activate_subscription_webhook(subscription_id: str, customer_id: str, user_id: str, plan_id: str) -> bool:
    """
    Ativa assinatura via webhook (mesma lógica do endpoint /activate).
    """
    try:
        logger.info(f"🔥 [WEBHOOK] Ativando assinatura: user={user_id}, plan={plan_id}")
        
        # Buscar dados da assinatura no Stripe
        sub = stripe.Subscription.retrieve(subscription_id)
        stripe_status = sub.get("status", "active")
        
        # Converter timestamps
        cps = int(sub.get("current_period_start", 0))
        cpe = int(sub.get("current_period_end", 0))
        
        if cps > 1000000000000:
            cps = cps // 1000
        if cpe > 1000000000000:
            cpe = cpe // 1000
            
        period_start = datetime.fromtimestamp(cps).isoformat()
        period_end = datetime.fromtimestamp(cpe).isoformat()
        
        # Chamar RPC de ativação (mesma do endpoint)
        rpc_params = {
            "p_user_id": user_id,
            "p_stripe_sub_id": subscription_id,
            "p_stripe_cust_id": customer_id,
            "p_plan": plan_id,
            "p_status": stripe_status,
            "p_start": period_start,
            "p_end": period_end
        }
        
        logger.info(f"🔥 [WEBHOOK] Chamando RPC: {rpc_params}")
        
        response = supabase_admin.rpc("activate_subscription_rpc", rpc_params).execute()
        
        if response.data:
            logger.info(f"✅ [WEBHOOK] Assinatura ativada com sucesso: user={user_id}")
            return True
        else:
            logger.error(f"❌ [WEBHOOK] RPC retornou False: user={user_id}")
            return False
            
    except Exception as e:
        logger.error(f"❌ [WEBHOOK] Erro ao ativar assinatura: {e}")
        return False


def activate_one_time_payment_webhook(session_id: str, customer_id: str, user_id: str, plan_id: str) -> bool:
    """
    Ativa créditos avulsos via webhook.
    Adiciona créditos ao saldo existente (não sobrescreve).
    """
    try:
        logger.info(f"🔥 [WEBHOOK] Ativando créditos avulsos: user={user_id}, plan={plan_id}")
        
        # Buscar dados do plano
        plan = PRICING.get(plan_id, {"credits": 1})
        credits = plan.get("credits", 1)
        
        # Verificar se já tem registro de créditos avulsos
        existing = (
            supabase_admin.table("user_credits")
            .select("balance")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        existing_row = (existing.data or [])[0] if existing.data else None
        
        if existing_row:
            # Adicionar ao saldo existente
            new_balance = int(existing_row.get("balance", 0)) + credits
            logger.info(f"🔥 [WEBHOOK] Créditos existentes: {existing_row.get('balance', 0)}, adicionando {credits}, novo saldo: {new_balance}")
            supabase_admin.table("user_credits").update(
                {"balance": new_balance}
            ).eq("user_id", user_id).execute()
        else:
            # Criar novo registro
            credits_data = {
                "user_id": user_id,
                "balance": credits,
            }
            supabase_admin.table("user_credits").insert(credits_data).execute()
        
        logger.info(f"✅ [WEBHOOK] Créditos avulsos ativados: user={user_id}, credits={credits}")
        return True
            
    except Exception as e:
        logger.error(f"❌ [WEBHOOK] Erro ao ativar créditos avulsos: {e}")
        return False


def handle_checkout_session_completed(event_data: Dict[str, Any]) -> bool:
    """
    Handle checkout.session.completed webhook event.
    """
    try:
        session = event_data["object"]
        session_id = session["id"]
        customer_id = session.get("customer")
        
        logger.info(f"🔥 [WEBHOOK] Checkout completed: {session_id}")
        
        # Extrair user_id dos metadados
        user_id = extract_user_from_metadata(session.get("metadata", {}))
        
        if not user_id:
            logger.error(f"❌ [WEBHOOK] User ID não encontrado na sessão: {session_id}")
            return False
        
        # Determinar tipo de pagamento
        subscription_id = session.get("subscription")
        
        if subscription_id:
            # Pagamento de assinatura
            plan_id = determine_plan_from_price(session.get("display_items", [{}])[0].get("price", {}).get("id", ""))
            return activate_subscription_webhook(subscription_id, customer_id, user_id, plan_id)
        else:
            # Pagamento avulso
            plan_id = session.get("metadata", {}).get("plan", "credit_1")
            return activate_one_time_payment_webhook(session_id, customer_id, user_id, plan_id)
            
    except Exception as e:
        logger.error(f"❌ [WEBHOOK] Erro ao processar checkout.session.completed: {e}")
        return False


def handle_invoice_payment_succeeded(event_data: Dict[str, Any]) -> bool:
    """
    Handle invoice.payment_succeeded webhook event.
    Para renovações de assinatura.
    """
    try:
        invoice = event_data["object"]
        subscription_id = invoice.get("subscription")
        customer_id = invoice.get("customer")
        
        logger.info(f"🔥 [WEBHOOK] Invoice payment succeeded: sub={subscription_id}")
        
        if not subscription_id:
            logger.warning("⚠️ [WEBHOOK] Invoice sem subscription_id")
            return True  # Não é erro, pode ser one-time
        
        # Buscar assinatura para determinar plano
        sub = stripe.Subscription.retrieve(subscription_id)
        plan_id = determine_plan_from_price(sub.get("items", {}).get("data", [{}])[0].get("price", {}).get("id", ""))
        
        # Buscar user_id do customer
        customer = stripe.Customer.retrieve(customer_id)
        user_id = customer.metadata.get("user_id")
        
        if not user_id:
            logger.error(f"❌ [WEBHOOK] User ID não encontrado no customer: {customer_id}")
            return False
        
        # Para renovações, apenas garantir que o usage está resetado
        # (a assinatura já existe, só precisa resetar usage mensal)
        try:
            from datetime import datetime, timedelta
            period_start = datetime.now().replace(day=1).isoformat()
            
            # Resetar usage para novo período
            usage_data = {
                "user_id": user_id,
                "period_start": period_start,
                "used": 0,
                "usage_limit": PRICING.get(plan_id, {"credits": 30}).get("credits", 30)
            }
            
            supabase_admin.table("usage").upsert(usage_data).execute()
            logger.info(f"✅ [WEBHOOK] Usage resetado para renovação: user={user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [WEBHOOK] Erro ao resetar usage: {e}")
            return False
            
    except Exception as e:
        logger.error(f"❌WEBHOOK] Erro ao processar invoice.payment_succeeded: {e}")
        return False


def process_webhook_event(event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processa webhook events do Stripe.
    """
    logger.info(f"🔥 [WEBHOOK] Processando evento: {event_type}")
    
    success = False
    message = "Evento processado"
    
    try:
        if event_type == "checkout.session.completed":
            success = handle_checkout_session_completed(event_data)
            message = "Pagamento confirmado e créditos ativados" if success else "Falha ao ativar créditos"
            
        elif event_type == "invoice.payment_succeeded":
            success = handle_invoice_payment_succeeded(event_data)
            message = "Renovação processada" if success else "Falha na renovação"
            
        elif event_type == "customer.subscription.created":
            # Apenas log, a ativação real é no checkout.session.completed
            logger.info(f"🔥 [WEBHOOK] Assinatura criada (aguardando pagamento)")
            success = True
            message = "Assinatura criada"
            
        else:
            logger.info(f"🔥 [WEBHOOK] Evento ignorado: {event_type}")
            success = True
            message = "Evento ignorado"
    
    except Exception as e:
        logger.error(f"❌ [WEBHOOK] Erro crítico ao processar evento {event_type}: {e}")
        success = False
        message = f"Erro crítico: {str(e)}"
    
    return {
        "success": success,
        "event_type": event_type,
        "message": message,
        "processed_at": datetime.now().isoformat()
    }
