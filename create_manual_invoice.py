#!/usr/bin/env python3
"""
Cria fatura manual com R$ 1,99 para teste
"""
import stripe
import os
from pathlib import Path

def create_manual_invoice():
    """Cria fatura manual com valor visível"""
    
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
        
        print(f"🧪 Criando fatura manual com valor visível")
        
        # Criar fatura manual
        invoice = stripe.Invoice.create(
            customer=customer_id,
            description="Setup Fee - Trial 7 Dias",
            metadata={"type": "manual_setup_fee"}
        )
        
        # Adicionar item com valor real
        invoice_item = stripe.InvoiceItem.create(
            customer=customer_id,
            amount=199,  # R$ 1,99 em centavos
            currency="brl",
            description="Setup Fee - Trial 7 Dias",
            metadata={"type": "manual_setup_fee"}
        )
        
        # Em modo teste, marcar como paga manualmente
        # (Em produção, isso seria feito pelo checkout)
        invoice = stripe.Invoice.pay(
            invoice.id,
            payment_method="pm_card_visa"  # Cartão de teste
        )
        
        print(f"✅ Fatura criada e paga: {invoice.id}")
        print(f"💰 Valor: R$ {invoice.total / 100:.2f}")
        print(f"📋 Status: {invoice.status}")
        print(f"🔗 URL: {invoice.hosted_invoice_url}")
        
        # Buscar portal atualizado
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
    create_manual_invoice()
