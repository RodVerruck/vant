#!/usr/bin/env python3
"""
Cria usuário de teste completo no Supabase
"""
import requests
import json
import uuid

def create_test_user():
    """Cria usuário completo no Supabase"""
    
    print("🧪 Criando usuário de teste completo")
    print("=" * 40)
    
    # Gerar dados do usuário
    test_user_id = str(uuid.uuid4())
    test_email = f"test-{test_user_id[:8]}@vant.test"
    
    print(f"👤 User ID: {test_user_id}")
    print(f"📧 Email: {test_email}")
    
    # 1. Criar usuário no Supabase Auth
    print("\n1. Criando usuário no Supabase Auth...")
    
    try:
        # Criar usuário via API do Supabase
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/create-supabase-user",
            json={
                "user_id": test_user_id,
                "email": test_email
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ Usuário criado no Supabase: {response.json()}")
        else:
            print(f"❌ Erro ao criar usuário: {response.json()}")
            return
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return
    
    # 2. Criar customer no Stripe
    print("\n2. Criando customer no Stripe...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/create-real-customer",
            json={"user_id": test_user_id},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            customer_data = response.json()
            print(f"✅ Customer criado: {customer_data['customer_id']}")
        else:
            print(f"❌ Erro ao criar customer: {response.json()}")
            return
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return
    
    # 3. Criar assinatura manual
    print("\n3. Criando assinatura manual...")
    
    try:
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
        else:
            print(f"❌ Erro ao criar assinatura: {response.json()}")
            return
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return
    
    # 4. Verificar status final
    print("\n4. Verificando status final...")
    
    try:
        response = requests.get(f"http://127.0.0.1:8000/api/user/status/{test_user_id}")
        
        if response.status_code == 200:
            status = response.json()
            print(f"📊 Status final: {status}")
            
            # Testar endpoint de portal
            response = requests.post(
                "http://127.0.0.1:8000/api/stripe/create-portal-session",
                json={"user_id": test_user_id},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print(f"🔗 Portal URL: {response.json()['portal_url']}")
            else:
                print(f"❌ Erro no portal: {response.json()}")
        else:
            print(f"❌ Erro ao verificar status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    create_test_user()
