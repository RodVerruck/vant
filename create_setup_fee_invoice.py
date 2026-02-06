#!/usr/bin/env python3
"""
Cria fatura de setup fee de R$ 1,99
"""
import stripe
import os
from pathlib import Path

def create_setup_fee_invoice():
    """Cria fatura de setup fee"""
    
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
        
        print(f"🧪 Criando fatura de setup fee para customer: {customer_id}")
        
        # Buscar assinatura atual
        subscriptions = stripe.Subscription.list(customer=customer_id, limit=1)
        if not subscriptions.data:
            print("❌ Nenhuma assinatura encontrada")
            return
        
        subscription = subscriptions.data[0]
        print(f"📋 Assinatura encontrada: {subscription.id}")
        
        # Criar fatura de setup fee
        invoice = stripe.Invoice.create(
            customer=customer_id,
            description="Setup Fee - Trial 7 Dias",
            metadata={
                "subscription_id": subscription.id,
                "type": "setup_fee"
            }
        )
        
        print(f"📄 Fatura criada: {invoice.id}")
        
        # Adicionar item de R$ 1,99
        invoice_item = stripe.InvoiceItem.create(
            customer=customer_id,
            amount=199,  # R$ 1,99 em centavos
            currency="brl",
            description="Setup Fee - Trial 7 Dias",
            metadata={
                "subscription_id": subscription.id,
                "type": "setup_fee"
            }
        )
        
        print(f"💰 Item adicionado: R$ 1,99")
        
        # Finalizar fatura
        invoice = stripe.Invoice.finalize_invoice(invoice.id)
        
        print(f"✅ Fatura finalizada: {invoice.id}")
        print(f"💰 Valor total: R$ {invoice.total / 100:.2f}")
        print(f"📋 Status: {invoice.status}")
        print(f"🔗 URL: {invoice.hosted_invoice_url}")
        
        # Criar portal para verificar
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:3000?portal=session_complete"
        )
        
        print(f"🔗 Portal URL atualizado: {portal_session.url}")
        
        return portal_session.url
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

if __name__ == "__main__":
    create_setup_fee_invoice()
