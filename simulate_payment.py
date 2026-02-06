#!/usr/bin/env python3
"""
Simula pagamento da fatura de setup fee
"""
import stripe
import os
from pathlib import Path

def simulate_payment():
    """Simula pagamento da fatura"""
    
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
        
        print(f"🧪 Simulando pagamento para customer: {customer_id}")
        
        # Buscar faturas recentes
        invoices = stripe.Invoice.list(customer=customer_id, limit=5)
        
        for invoice in invoices.data:
            print(f"\n--- Fatura {invoice.id} ---")
            print(f"💰 Valor: R$ {invoice.total / 100:.2f}")
            print(f"📋 Status: {invoice.status}")
            
            # Se for fatura de setup fee com R$ 0,00, tentar pagar
            if invoice.total == 0 and "setup_fee" in str(invoice.description):
                print(f"🔔 Tentando pagar fatura de setup fee...")
                
                # Em modo teste, podemos simular pagamento
                try:
                    # Criar payment intent para a fatura
                    payment_intent = stripe.PaymentIntent.create(
                        amount=199,  # R$ 1,99 em centavos
                        currency="brl",
                        customer=customer_id,
                        payment_method="pm_card_visa",  # Cartão de teste
                        confirm=True,
                        metadata={"invoice_id": invoice.id}
                    )
                    
                    print(f"💳 Payment Intent criado: {payment_intent.id}")
                    print(f"✅ Pagamento simulado: R$ {payment_intent.amount / 100:.2f}")
                    
                    # Atualizar fatura
                    updated_invoice = stripe.Invoice.retrieve(invoice.id)
                    print(f"📋 Status atualizado: {updated_invoice.status}")
                    
                except Exception as payment_error:
                    print(f"⚠️ Erro ao simular pagamento: {payment_error}")
        
        # Verificar resultado final
        print(f"\n📊 Verificando faturas finais:")
        final_invoices = stripe.Invoice.list(customer=customer_id, limit=5)
        
        for invoice in final_invoices.data:
            print(f"📄 {invoice.id}: R$ {invoice.total / 100:.2f} - {invoice.status}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    simulate_payment()
