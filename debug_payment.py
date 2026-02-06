#!/usr/bin/env python3
"""
Script para debug do fluxo de pagamento e ativação
"""
import requests
import json

def test_payment_flow():
    """Testa o fluxo completo de pagamento"""
    
    print("🔍 Debug do Fluxo de Pagamento")
    print("=" * 50)
    
    # 1. Verificar status atual do usuário
    print("\n1. Status atual do usuário:")
    response = requests.get("http://127.0.0.1:8000/api/user/status/7912ac35-6fb8-4ed0-807b-b0bc2de88274")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # 2. Verificar se há assinaturas no Stripe (simulação)
    print("\n2. Simulando ativação manual:")
    
    # Criar uma assinatura manualmente no banco
    manual_activation_data = {
        "session_id": "manual_test_session",
        "user_id": "7912ac35-6fb8-4ed0-807b-b0bc2de88274",
        "plan_id": "pro_monthly"
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/debug/manual-activate",
        json=manual_activation_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # 3. Verificar status após ativação
    print("\n3. Status após ativação:")
    response = requests.get("http://127.0.0.1:8000/api/user/status/7912ac35-6fb8-4ed0-807b-b0bc2de88274")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_payment_flow()
