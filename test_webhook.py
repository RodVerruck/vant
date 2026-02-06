#!/usr/bin/env python3
"""
Test script para validar webhook do Stripe.
Executar localmente para testar a implementação.
"""

import os
import json
import hmac
import hashlib
import requests
from datetime import datetime

# Configuração
WEBHOOK_URL = "http://localhost:8000/api/stripe/webhook"
STRIPE_WEBHOOK_SECRET = "whsec_test_local_webhook_secret_for_development_only"

def create_test_signature(payload: str, secret: str) -> str:
    """Cria assinatura HMAC SHA256 como o Stripe."""
    timestamp = int(datetime.now().timestamp())
    signed_payload = f"{timestamp}.{payload}"
    
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"t={timestamp},v1={signature}"

def test_webhook():
    """Testa o endpoint do webhook."""
    
    print("🧪 [TEST] Iniciando teste do webhook Stripe...")
    
    # 1. Teste de evento checkout.session.completed
    print("\n1️⃣ [TEST] Testando checkout.session.completed...")
    
    checkout_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_123456789",
                "customer": "cus_test_123",
                "subscription": "sub_test_123",
                "metadata": {
                    "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    "plan": "pro_monthly"
                },
                "display_items": [
                    {
                        "price": {
                            "id": "price_1Svo9G2VONQto1dc7pwdC0dQ"
                        }
                    }
                ]
            }
        }
    }
    
    payload = json.dumps(checkout_event, separators=(',', ':'))
    signature = create_test_signature(payload, STRIPE_WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "stripe-signature": signature
    }
    
    try:
        response = requests.post(WEBHOOK_URL, data=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ [TEST] Sucesso: {result.get('message')}")
        else:
            print(f"❌ [TEST] Erro HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ [TEST] Erro de conexão: {e}")
    
    # 2. Teste de evento invoice.payment_succeeded
    print("\n2️⃣ [TEST] Testando invoice.payment_succeeded...")
    
    invoice_event = {
        "type": "invoice.payment_succeeded",
        "data": {
            "object": {
                "id": "in_test_123456789",
                "subscription": "sub_test_123",
                "customer": "cus_test_123"
            }
        }
    }
    
    payload = json.dumps(invoice_event, separators=(',', ':'))
    signature = create_test_signature(payload, STRIPE_WEBHOOK_SECRET)
    
    headers["stripe-signature"] = signature
    
    try:
        response = requests.post(WEBHOOK_URL, data=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ [TEST] Sucesso: {result.get('message')}")
        else:
            print(f"❌ [TEST] Erro HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ [TEST] Erro de conexão: {e}")
    
    # 3. Teste de assinatura inválida
    print("\n3️⃣ [TEST] Testando assinatura inválida...")
    
    payload = json.dumps(checkout_event, separators=(',', ':'))
    headers["stripe-signature"] = "t=1234567890,v1=invalid_signature_hash"
    
    try:
        response = requests.post(WEBHOOK_URL, data=payload, headers=headers, timeout=10)
        
        if response.status_code == 401:
            print("✅ [TEST] Assinatura inválida rejeitada corretamente")
        else:
            print(f"❌ [TEST] Deveria retornar 401, retornou {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ [TEST] Erro de conexão: {e}")
    
    # 4. Teste sem assinatura
    print("\n4️⃣ [TEST] Testando sem assinatura...")
    
    headers.pop("stripe-signature", None)
    
    try:
        response = requests.post(WEBHOOK_URL, data=payload, headers=headers, timeout=10)
        
        if response.status_code == 400:
            print("✅ [TEST] Ausência de assinatura detectada corretamente")
        else:
            print(f"❌ [TEST] Deveria retornar 400, retornou {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ [TEST] Erro de conexão: {e}")
    
    print("\n🎉 [TEST] Testes concluídos!")
    print("\n📝 [NOTA] Para testes reais:")
    print("   1. Configure STRIPE_WEBHOOK_SECRET no .env")
    print("   2. Use 'stripe trigger checkout.session.completed'")
    print("   3. Monitore logs do backend")

if __name__ == "__main__":
    print("🚀 [TEST] Verificando se backend está online...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ [TEST] Backend online, iniciando testes...")
            test_webhook()
        else:
            print(f"❌ [TEST] Backend retornou status {response.status_code}")
    except requests.exceptions.RequestException:
        print("❌ [TEST] Backend não está online em http://localhost:8000")
        print("📝 [NOTA] Inicie o backend com: cd backend && python start_server.py")
