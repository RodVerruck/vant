#!/usr/bin/env python3
"""
Teste mínimo do portal do Stripe
"""
import stripe
import os
from pathlib import Path

def test_minimal_portal():
    """Testa criação de portal com configuração mínima"""
    
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
        # Customer ID real que criamos
        customer_id = "cus_TvTqH9K7PT8NFy"
        
        print(f"🧪 Testando portal para customer: {customer_id}")
        
        # Tentar criar sessão mínima
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:3000?portal=session_complete"
        )
        
        print(f"✅ Portal criado com sucesso!")
        print(f"📋 Session ID: {session.id}")
        print(f"🔗 URL: {session.url}")
        
        return session.url
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

if __name__ == "__main__":
    test_minimal_portal()
