#!/usr/bin/env python3
"""
Cria uma sessão real do portal para o usuário
"""
import stripe
import os
from pathlib import Path

def create_real_portal():
    """Cria portal real para o customer"""
    
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
        
        print(f"🧪 Criando portal real para customer: {customer_id}")
        
        # Criar sessão do portal SEM configuração (usa padrão do Stripe)
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:3000?portal=session_complete"
        )
        
        print(f"✅ Portal real criado!")
        print(f"📋 Session ID: {session.id}")
        print(f"🔗 URL: {session.url}")
        
        # Verificar se o customer tem assinaturas
        subscriptions = stripe.Subscription.list(customer=customer_id, limit=10)
        print(f"📊 Assinaturas encontradas: {len(subscriptions.data)}")
        
        for sub in subscriptions.data:
            print(f"   - ID: {sub.id}")
            print(f"   - Status: {sub.status}")
            print(f"   - Plano: {sub.items.data[0].price.id if sub.items.data else 'N/A'}")
        
        return session.url
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

if __name__ == "__main__":
    create_real_portal()
