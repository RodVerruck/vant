#!/usr/bin/env python3
"""
Cria a assinatura correta: Trial R$ 1,99 + Early Bird R$ 19,90
"""
import stripe
import os
from pathlib import Path

def create_correct_subscription():
    """Cria assinatura com valores corretos"""
    
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
        
        print(f"🧪 Criando assinatura correta para customer: {customer_id}")
        
        # Usar price ID do TRIAL (R$ 1,99 trial + R$ 19,90/mês depois)
        trial_price_id = os.getenv("STRIPE_PRICE_ID_TRIAL")
        if not trial_price_id:
            print("❌ STRIPE_PRICE_ID_TRIAL não encontrado")
            return
        
        print(f"💳 Usando TRIAL price ID: {trial_price_id}")
        print(f"💰 Preço: R$ 1,99 (7 dias trial) + R$ 19,90/mês após")
        
        # Cancelar assinatura anterior se existir
        try:
            subscriptions = stripe.Subscription.list(customer=customer_id, limit=10)
            for sub in subscriptions.data:
                if sub.status in ["trialing", "active"]:
                    print(f"🗑️ Cancelando assinatura anterior: {sub.id}")
                    stripe.Subscription.delete(sub.id)
        except Exception as e:
            print(f"⚠️ Erro ao cancelar assinatura anterior: {e}")
        
        # Criar assinatura correta
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": trial_price_id}],
            payment_behavior="default_incomplete",
            payment_settings={"save_default_payment_method": "on_subscription"},
            expand=["latest_invoice.payment_intent"],
            trial_period_days=7
        )
        
        print(f"✅ Assinatura correta criada!")
        print(f"📋 Subscription ID: {subscription.id}")
        print(f"💰 Status: {subscription.status}")
        print(f"🗓️ Trial: 7 dias")
        print(f"💳 Após trial: R$ 19,90/mês")
        
        # Criar portal para testar
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
    create_correct_subscription()
