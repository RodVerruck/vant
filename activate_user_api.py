#!/usr/bin/env python3
"""
Ativa usuário teste@sememail.com via API
"""
import requests
import json

def activate_user():
    """Ativa usuário pelo email"""
    
    print("🔧 Ativando usuário teste@sememail.com")
    print("=" * 40)
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/activate-by-email",
            json={
                "email": "teste@sememail.com",
                "plan_id": "pro_monthly"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📋 Status: {response.status_code}")
        print(f"📋 Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                user_id = data.get("user_id")
                print(f"\n✅ Usuário ativado!")
                print(f"👤 User ID: {user_id}")
                print(f"💳 Plano: {data.get('plan')}")
                print(f"🪙 Créditos: {data.get('credits')}")
                
                # Verificar status
                print(f"\n🔍 Verificando status...")
                status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📊 Status: {status}")
                
        else:
            print(f"❌ Erro: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    activate_user()
