#!/usr/bin/env python3
"""
Corrige o problema do usuário real teste@sememail.com
"""
import requests
import json
import uuid

def fix_real_user():
    """Cria assinatura manual para usuário real"""
    
    print("🔧 Corrigindo usuário teste@sememail.com")
    print("=" * 40)
    
    # Usar UUID válido
    user_id = "550e8400-e29b-41d4-a716-446655440000"  # UUID válido
    
    # 1. Criar assinatura manual para o usuário
    print(f"\n1. Criando assinatura manual para user_id: {user_id}")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/debug/manual-activate",
            json={
                "user_id": user_id,
                "plan_id": "pro_monthly"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ Assinatura criada: {response.json()}")
            
            # 2. Verificar status
            print(f"\n2. Verificando status...")
            
            status_response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"📊 Status: {status}")
                
                if status.get("has_active_plan") and status.get("credits_remaining", 0) > 0:
                    print(f"✅ SUCESSO! Usuário tem {status['credits_remaining']} créditos")
                    print(f"🎯 Agora teste no frontend com este user_id: {user_id}")
                else:
                    print(f"❌ Ainda sem créditos")
            else:
                print(f"❌ Erro ao verificar status: {status_response.status_code}")
                print(f"📋 Response: {status_response.json()}")
                
        else:
            print(f"❌ Erro ao criar assinatura: {response.json()}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    fix_real_user()
