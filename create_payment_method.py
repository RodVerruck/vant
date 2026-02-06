#!/usr/bin/env python3
"""
Cria payment method e fatura para teste
"""
import stripe
import os
from pathlib import Path

def create_payment_method_and_invoice():
    """Cria payment method e fatura"""
    
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
        
        print(f"🧪 Criando payment method para customer: {customer_id}")
        
        # Criar payment method de teste usando token
        payment_method = stripe.PaymentMethod.create(
            type="card",
            card={
                "token": "tok_visa"  # Token de teste do Stripe
            },
            billing_details={
                "address": {
                    "line1": "Rua Teste 123",
                    "city": "São Paulo",
                    "state": "SP",
                    "postal_code": "01234567",
                    "country": "BR",
                },
                "email": "rodrigoverruck@gmail.com",
                "name": "Test User"
            }
        )
        
        # Anexar payment method ao customer
        stripe.PaymentMethod.attach(
            payment_method.id,
            customer=customer_id
        )
        
        print(f"✅ Payment method criado: {payment_method.id}")
        
        # Criar fatura
        invoice = stripe.Invoice.create(
            customer=customer_id,
            description="Setup Fee - Trial 7 Dias",
            metadata={"type": "manual_setup_fee"}
        )
        
        # Adicionar item
        invoice_item = stripe.InvoiceItem.create(
            customer=customer_id,
            amount=199,  # R$ 1,99 em centavos
            currency="brl",
            description="Setup Fee - Trial 7 Dias",
            metadata={"type": "manual_setup_fee"}
        )
        
        # Pagar fatura
        invoice = stripe.Invoice.pay(
            invoice.id,
            payment_method=payment_method.id
        )
        
        print(f"✅ Fatura criada e paga: {invoice.id}")
        print(f"💰 Valor: R$ {invoice.total / 100:.2f}")
        print(f"📋 Status: {invoice.status}")
        print(f"🔗 URL: {invoice.hosted_invoice_url}")
        
        # Criar portal atualizado
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
    create_payment_method_and_invoice()
