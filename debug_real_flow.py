#!/usr/bin/env python3
"""
Debug do fluxo real de ativação pós-pagamento
"""
import requests
import json

def debug_real_flow():
    """Debug do fluxo real de pagamento e ativação"""
    
    print("🔍 Debug do Fluxo Real de Pagamento")
    print("=" * 50)
    
    # 1. Buscar usuário teste@sememail.com no banco
    print("\n1. Buscando usuário teste@sememail.com...")
    
    try:
        # Buscar todas as assinaturas para encontrar o usuário
        response = requests.get("http://127.0.0.1:8000/api/debug/all-subscriptions")
        
        if response.status_code == 200:
            subscriptions = response.json()
            
            # Procurar pelo email teste@sememail.com
            test_user_id = None
            for sub in subscriptions:
                user_id = sub.get("user_id")
                if user_id:
                    # Tentar buscar dados do usuário
                    try:
                        user_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
                        if user_response.status_code == 200:
                            status = user_response.json()
                            print(f"👤 User ID: {user_id}")
                            print(f"📊 Status: {status}")
                            test_user_id = user_id
                            break
                    except:
                        continue
            
            if test_user_id:
                print(f"✅ Usuário encontrado: {test_user_id}")
                
                # 2. Verificar assinatura no banco
                print(f"\n2. Verificando assinatura no banco...")
                
                response = requests.post(
                    "http://127.0.0.1:8000/api/debug/check-subscription",
                    json={"user_id": test_user_id},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    subscription_data = response.json()
                    print(f"📋 Assinatura: {subscription_data}")
                else:
                    print(f"❌ Erro ao buscar assinatura: {response.json()}")
                
                # 3. Verificar se há sessão Stripe
                print(f"\n3. Verificando se há sessão Stripe...")
                
                # Buscar logs de ativação recentes
                print(f"📝 Verificando logs de ativação...")
                
                # 4. Testar ativação manual
                print(f"\n4. Testando ativação manual...")
                
                response = requests.post(
                    "http://127.0.0.1:8000/api/entitlements/activate",
                    json={
                        "session_id": "test-session-manual",
                        "user_id": test_user_id,
                        "plan_id": "pro_monthly"
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📋 Status: {response.status_code}")
                print(f"📋 Response: {response.json()}")
                
                # 5. Verificar status final
                print(f"\n5. Verificando status final...")
                
                response = requests.get(f"http://127.0.0.1:8000/api/user/status/{test_user_id}")
                if response.status_code == 200:
                    status = response.json()
                    print(f"📊 Status final: {status}")
                
            else:
                print("❌ Usuário teste@sememail.com não encontrado")
                
        else:
            print(f"❌ Erro ao buscar assinaturas: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    debug_real_flow()
