#!/usr/bin/env python3
"""
Verifica faturas do cliente no Stripe
"""
import stripe
import os
from pathlib import Path

def check_invoices():
    """Verifica faturas do cliente"""
    
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
        
        print(f"🧪 Verificando faturas do customer: {customer_id}")
        
        # Buscar todas as faturas
        invoices = stripe.Invoice.list(customer=customer_id, limit=10)
        
        print(f"📊 Total de faturas: {len(invoices.data)}")
        
        for invoice in invoices.data:
            print(f"\n--- Fatura {invoice.id} ---")
            print(f"📅 Data: {invoice.created}")
            print(f"💰 Valor: R$ {invoice.total / 100:.2f}")
            print(f"📋 Status: {invoice.status}")
            print(f"🔗 URL: {invoice.hosted_invoice_url}")
            
            # Verificar itens da fatura
            for line_item in invoice.lines.data:
                print(f"   - {line_item.description}: R$ {line_item.amount / 100:.2f}")
        
        # Se não houver faturas, criar uma manualmente
        if len(invoices.data) == 0:
            print(f"\n❌ Nenhuma fatura encontrada. Criando fatura manualmente...")
            
            # Buscar assinatura
            subscriptions = stripe.Subscription.list(customer=customer_id, limit=1)
            if subscriptions.data:
                subscription = subscriptions.data[0]
                
                # Criar fatura manual para o setup fee
                invoice = stripe.Invoice.create(
                    customer=customer_id,
                    description="Setup Fee - Trial 7 Dias",
                    metadata={"subscription_id": subscription.id}
                )
                
                # Adicionar item de R$ 1,99
                setup_fee_price = "price_1SvoER2VONQto1dcdi5VHNpM"  # R$ 1,99
                
                invoice_item = stripe.InvoiceItem.create(
                    customer=customer_id,
                    amount=199,  # R$ 1,99 em centavos
                    currency="brl",
                    description="Setup Fee - Trial 7 Dias",
                    metadata={"subscription_id": subscription.id}
                )
                
                # Finalizar fatura
                invoice = stripe.Invoice.finalize_invoice(invoice.id)
                
                print(f"✅ Fatura criada: {invoice.id}")
                print(f"💰 Valor: R$ {invoice.total / 100:.2f}")
                print(f"🔗 URL: {invoice.hosted_invoice_url}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    check_invoices()
