#!/usr/bin/env python3
"""
Testa o fluxo completo pelo frontend
"""
import requests
import json

def test_frontend_flow():
    """Testa o fluxo completo de pagamento pelo frontend"""
    
    print("🧪 Teste do Fluxo Frontend - Pagamento")
    print("=" * 50)
    
    # 1. Criar sessão de checkout
    print("\n1. Criando sessão de checkout...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/stripe/create-checkout-session",
            json={
                "plan_id": "trial",
                "customer_email": "teste@sememail.com",
                "score": 50
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            session_data = response.json()
            print(f"✅ Sessão criada: {session_data['id']}")
            print(f"🔗 URL: {session_data['url']}")
            
            # 2. Simular retorno do pagamento
            print(f"\n2. Simulando retorno do pagamento...")
            
            # Verificar sessão
            verify_response = requests.post(
                "http://127.0.0.1:8000/api/stripe/verify-checkout-session",
                json={"session_id": session_data['id']},
                headers={"Content-Type": "application/json"}
            )
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                print(f"✅ Sessão verificada: {verify_data}")
                
                # 3. Ativar entitlements
                print(f"\n3. Ativando entitlements...")
                
                # Buscar user ID pelo email (simulação)
                # Em produção, isso viria do frontend após login
                activate_response = requests.post(
                    "http://127.0.0.1:8000/api/entitlements/activate",
                    json={
                        "session_id": session_data['id'],
                        "user_id": "test-user-id",  # Precisa ser o ID real do usuário
                        "plan_id": "trial"
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📋 Status: {activate_response.status_code}")
                print(f"📋 Response: {activate_response.json()}")
                
            else:
                print(f"❌ Erro ao verificar sessão: {verify_response.json()}")
                
        else:
            print(f"❌ Erro ao criar sessão: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_frontend_flow()
