#!/usr/bin/env python3
"""
Debug do fluxo de ativação para novo usuário
"""
import requests
import json

def debug_new_user():
    """Debug completo do fluxo de ativação"""
    
    print("🔍 Debug do Fluxo de Ativação - Novo Usuário")
    print("=" * 50)
    
    # 1. Verificar se há algum usuário com assinatura ativa
    print("\n1. Buscando usuários com assinatura ativa...")
    
    # Buscar todas as assinaturas ativas
    try:
        response = requests.get("http://127.0.0.1:8000/api/debug/all-subscriptions")
        if response.status_code == 200:
            subscriptions = response.json()
            print(f"✅ Encontradas {len(subscriptions)} assinaturas:")
            for sub in subscriptions:
                print(f"   - User: {sub['user_id']}")
                print(f"     Plano: {sub['subscription_plan']}")
                print(f"     Status: {sub['subscription_status']}")
                print(f"     Customer: {sub['stripe_customer_id']}")
                print(f"     Créditos: {sub.get('credits', 'N/A')}")
        else:
            print(f"❌ Erro ao buscar assinaturas: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # 2. Testar ativação manual para um usuário de teste
    print("\n2. Testando ativação manual...")
    
    # Gerar UUID válido para teste
    import uuid
    test_user_id = str(uuid.uuid4())
    
    print(f"🧪 Usando UUID de teste: {test_user_id}")
    
    # Criar customer para teste
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/create-real-customer",
            json={"user_id": test_user_id},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            customer_data = response.json()
            print(f"✅ Customer criado: {customer_data['customer_id']}")
            
            # Criar assinatura
            response = requests.post(
                "http://127.0.0.1:8000/api/debug/manual-activate",
                json={
                    "user_id": test_user_id,
                    "plan_id": "pro_monthly"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print(f"✅ Assinatura criada: {response.json()}")
                
                # Verificar status
                response = requests.get(f"http://127.0.0.1:8000/api/user/status/{test_user_id}")
                if response.status_code == 200:
                    status = response.json()
                    print(f"📊 Status final: {status}")
                else:
                    print(f"❌ Erro ao verificar status: {response.status_code}")
            else:
                print(f"❌ Erro ao criar assinatura: {response.json()}")
        else:
            print(f"❌ Erro ao criar customer: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # 3. Testar endpoint de ativação
    print("\n3. Testando endpoint de ativação...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/entitlements/activate",
            json={
                "session_id": "test-session",
                "user_id": test_user_id,
                "plan_id": "pro_monthly"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📋 Status: {response.status_code}")
        print(f"📋 Response: {response.json()}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    debug_new_user()
