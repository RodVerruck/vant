#!/usr/bin/env python3
"""
Diagnóstico do usuário teste@sememail.com
"""
import requests
import json

def diagnose_user():
    """Diagnostica o usuário teste@sememail.com"""
    
    print("🔍 Diagnóstico: teste@sememail.com")
    print("=" * 50)
    
    # 1. Buscar usuário no Supabase Auth
    print("\n1. Buscando usuário no Supabase Auth...")
    
    try:
        response = requests.get(
            "http://127.0.0.1:8000/api/debug/find-user-by-email",
            params={"email": "teste@sememail.com"}
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Usuário encontrado: {user_data}")
            
            user_id = user_data.get("user_id")
            if user_id:
                # 2. Verificar status do usuário
                print(f"\n2. Verificando status do usuário {user_id}...")
                
                status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
                print(f"📋 Status: {status_response.status_code}")
                print(f"📋 Response: {status_response.json()}")
                
                # 3. Verificar assinatura no banco
                print(f"\n3. Verificando assinatura no banco...")
                
                sub_response = requests.post(
                    "http://127.0.0.1:8000/api/debug/check-subscription",
                    json={"user_id": user_id},
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📋 Assinatura: {sub_response.status_code}")
                print(f"📋 Response: {sub_response.json()}")
                
        else:
            print(f"❌ Usuário não encontrado: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    diagnose_user()
