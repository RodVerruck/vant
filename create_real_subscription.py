#!/usr/bin/env python3
"""
Cria uma assinatura real no Stripe para testes
"""
import stripe
import os
from pathlib import Path

def create_real_subscription():
    """Cria assinatura real no Stripe"""
    
    # Carregar variáveis do .env
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    # Configurar Stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    
    if not stripe.api_key:
        print("❌ STRIPE_SECRET_KEY não encontrada")
        return
    
    try:
        # Customer ID real
        customer_id = "cus_TvTqH9K7PT8NFy"
        
        print(f"🧪 Criando assinatura real para customer: {customer_id}")
        
        # Buscar price ID do plano pro mensal
        price_id = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY")
        if not price_id:
            print("❌ STRIPE_PRICE_ID_PRO_MONTHLY não encontrado")
            return
        
        print(f"💳 Usando price ID: {price_id}")
        
        # Criar assinatura real
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            payment_behavior="default_incomplete",
            payment_settings={"save_default_payment_method": "on_subscription"},
            expand=["latest_invoice.payment_intent"],
            trial_period_days=7  # 7 dias de trial
        )
        
        print(f"✅ Assinatura real criada!")
        print(f"📋 Subscription ID: {subscription.id}")
        print(f"💰 Status: {subscription.status}")
        print(f"🗓️ Trial: 7 dias")
        
        # Criar portal para testar cancelamento
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:3000?portal=session_complete"
        )
        
        print(f"🔗 Portal URL: {portal_session.url}")
        
        return portal_session.url
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

if __name__ == "__main__":
    create_real_subscription()
