#!/usr/bin/env python3
"""
Testa o fluxo completo de um novo usuário
"""
import requests
import json
import uuid

def test_new_user_flow():
    """Testa fluxo completo de novo usuário"""
    
    print("🧪 Teste: Fluxo Completo Novo Usuário")
    print("=" * 50)
    
    # 1. Criar novo usuário no Supabase Auth
    print("\n1. Criando novo usuário no Supabase...")
    
    new_email = f"test-new-{uuid.uuid4().hex[:8]}@vant.test"
    new_user_id = str(uuid.uuid4())
    
    print(f"📧 Email: {new_email}")
    print(f"👤 User ID: {new_user_id}")
    
    try:
        # Criar usuário via API de debug
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/create-supabase-user",
            json={
                "user_id": new_user_id,
                "email": new_email
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"❌ Erro ao criar usuário: {response.json()}")
            return
            
        print(f"✅ Usuário criado")
        
        # 2. Criar sessão de checkout
        print(f"\n2. Criando sessão de checkout...")
        
        checkout_response = requests.post(
            "http://127.0.0.1:8000/api/stripe/create-checkout-session",
            json={
                "plan_id": "trial",
                "customer_email": new_email,
                "score": 50
            },
            headers={"Content-Type": "application/json"}
        )
        
        if checkout_response.status_code != 200:
            print(f"❌ Erro ao criar checkout: {checkout_response.json()}")
            return
            
        session_data = checkout_response.json()
        session_id = session_data['id']
        print(f"✅ Sessão criada: {session_id}")
        
        # 3. Ativar entitlements
        print(f"\n3. Ativando entitlements...")
        
        activate_response = requests.post(
            "http://127.0.0.1:8000/api/entitlements/activate",
            json={
                "session_id": session_id,
                "user_id": new_user_id,
                "plan_id": "trial"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📋 Status: {activate_response.status_code}")
        print(f"📋 Response: {activate_response.json()}")
        
        # 4. Verificar status
        print(f"\n4. Verificando status final...")
        
        status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{new_user_id}")
        if status_response.status_code == 200:
            status = status_response.json()
            print(f"📊 Status: {status}")
            
            if status.get("has_active_plan") and status.get("credits_remaining", 0) > 0:
                print(f"\n🎉 SUCESSO! Novo usuário tem {status['credits_remaining']} créditos!")
                return True
            else:
                print(f"\n❌ FALHA! Usuário não tem créditos")
                return False
        else:
            print(f"❌ Erro ao verificar status: {status_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_new_user_flow()
    exit(0 if success else 1)
