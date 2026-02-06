#!/usr/bin/env python3
"""
Teste com usuário real criado pelo frontend
"""
import requests
import json

def test_real_user():
    """Testa ativação para usuário real"""
    
    print("🧪 Teste com Usuário Real - teste@sememail.com")
    print("=" * 50)
    
    # 1. Criar sessão de checkout para o usuário real
    print("\n1. Criando sessão de checkout...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/stripe/create-checkout-session",
            json={
                "plan_id": "trial",
                "customer_email": "teste@sememail.com",
                "score": 50,
                "client_reference_id": "test-user-id-real"  # Simular ID real
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            session_data = response.json()
            print(f"✅ Sessão criada: {session_data['id']}")
            
            # 2. Ativar entitlements com user_id real
            print(f"\n2. Ativando entitlements...")
            
            activate_response = requests.post(
                "http://127.0.0.1:8000/api/entitlements/activate",
                json={
                    "session_id": session_data['id'],
                    "user_id": "test-user-id-real",  # User ID consistente
                    "plan_id": "trial"
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📋 Status: {activate_response.status_code}")
            print(f"📋 Response: {activate_response.json()}")
            
            # 3. Verificar status
            print(f"\n3. Verificando status...")
            
            status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/test-user-id-real")
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"📊 Status: {status}")
            else:
                print(f"❌ Erro ao verificar status: {status_response.status_code}")
                
        else:
            print(f"❌ Erro ao criar sessão: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_real_user()
