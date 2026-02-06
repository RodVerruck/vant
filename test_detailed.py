#!/usr/bin/env python3
"""
Testa o fluxo e verifica a resposta detalhada
"""
import requests
import json
import uuid

def test_with_details():
    """Testa com logs detalhados"""
    
    print("🧪 Teste Detalhado - Novo Usuário")
    print("=" * 50)
    
    new_email = f"test-detailed-{uuid.uuid4().hex[:8]}@vant.test"
    new_user_id = str(uuid.uuid4())
    
    print(f"📧 Email: {new_email}")
    print(f"👤 User ID: {new_user_id}")
    
    # Criar usuário
    response = requests.post(
        "http://127.0.0.1:8000/api/debug/create-supabase-user",
        json={"user_id": new_user_id, "email": new_email},
        headers={"Content-Type": "application/json"}
    )
    print(f"1. Criar usuário: {response.status_code}")
    
    # Criar checkout
    checkout = requests.post(
        "http://127.0.0.1:8000/api/stripe/create-checkout-session",
        json={"plan_id": "trial", "customer_email": new_email, "score": 50},
        headers={"Content-Type": "application/json"}
    )
    session_id = checkout.json()['id']
    print(f"2. Criar checkout: {checkout.status_code}, Session: {session_id}")
    
    # Ativar
    activate = requests.post(
        "http://127.0.0.1:8000/api/entitlements/activate",
        json={"session_id": session_id, "user_id": new_user_id, "plan_id": "trial"},
        headers={"Content-Type": "application/json"}
    )
    print(f"3. Ativar: {activate.status_code}")
    print(f"   Headers: {dict(activate.headers)}")
    print(f"   Text: {activate.text}")
    print(f"   JSON: {activate.json() if activate.text else 'Empty'}")
    
    # Verificar status
    status = requests.get(f"http://127.0.0.1:8000/api/user/status/{new_user_id}")
    print(f"4. Status: {status.status_code}")
    print(f"   {status.json()}")

if __name__ == "__main__":
    test_with_details()
