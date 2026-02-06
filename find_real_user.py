#!/usr/bin/env python3
"""
Busca usuário real pelo email no Supabase
"""
import requests
import json

def find_real_user():
    """Busca usuário teste@sememail.com no Supabase"""
    
    print("🔍 Buscando usuário teste@sememail.com")
    print("=" * 40)
    
    try:
        # Buscar todos os usuários via API admin do Supabase
        response = requests.get(
            "http://127.0.0.1:8000/api/debug/find-user-by-email",
            params={"email": "teste@sememail.com"},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Usuário encontrado: {user_data}")
            
            user_id = user_data.get("user_id")
            if user_id:
                # Verificar status
                status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📊 Status atual: {status}")
                
                # Verificar assinatura
                sub_response = requests.post(
                    "http://127.0.0.1:8000/api/debug/check-subscription",
                    json={"user_id": user_id},
                    headers={"Content-Type": "application/json"}
                )
                
                if sub_response.status_code == 200:
                    sub_data = sub_response.json()
                    print(f"📋 Assinatura: {sub_data}")
                else:
                    print(f"❌ Sem assinatura: {sub_response.json()}")
                
        else:
            print(f"❌ Erro ao buscar usuário: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    find_real_user()
