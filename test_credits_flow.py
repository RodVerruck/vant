#!/usr/bin/env python3
"""
Script para testar o fluxo completo de créditos
"""
import requests
import json

def test_credits_flow():
    """Testa o fluxo completo de créditos"""
    
    print("🧪 Teste Completo do Sistema de Créditos")
    print("=" * 50)
    
    user_id = "7912ac35-6fb8-4ed0-807b-b0bc2de88274"
    
    # 1. Status inicial
    print("\n1. Status inicial dos créditos:")
    response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
    status_data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Response: {status_data}")
    
    initial_credits = status_data.get("credits_remaining", 0)
    print(f"Créditos iniciais: {initial_credits}")
    
    # 2. Testar consumo de 1 crédito
    print("\n2. Consumindo 1 crédito...")
    consume_data = {"user_id": user_id}
    response = requests.post(
        "http://127.0.0.1:8000/api/entitlements/consume-one",
        json=consume_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # 3. Verificar status após consumo
    print("\n3. Status após consumo:")
    response = requests.get(f"http://127.0.0.1:8000/api/user/status/{user_id}")
    status_data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Response: {status_data}")
    
    final_credits = status_data.get("credits_remaining", 0)
    print(f"Créditos finais: {final_credits}")
    
    # 4. Verificar se o consumo funcionou
    print("\n4. Validação:")
    if final_credits == initial_credits - 1:
        print("✅ Consumo de crédito funcionou corretamente!")
        print(f"   {initial_credits} → {final_credits} (-1)")
    else:
        print("❌ Problema no consumo de créditos!")
        print(f"   Esperado: {initial_credits - 1}, Obtido: {final_credits}")
    
    # 5. Testar sincronização
    print("\n5. Testando sincronização de entitlements:")
    sync_data = {"user_id": user_id}
    response = requests.post(
        "http://127.0.0.1:8000/api/entitlements/sync",
        json=sync_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # 6. Verificar se o botão de gerenciamento aparece
    print("\n6. Verificando se usuário tem assinatura ativa:")
    if status_data.get("has_active_plan"):
        print("✅ Usuário tem assinatura ativa - botão 'Gerenciar' deve aparecer")
        print("   Teste: http://127.0.0.1:8000/api/stripe/create-portal-session")
    else:
        print("❌ Usuário não tem assinatura ativa")
    
    print("\n" + "=" * 50)
    print("🎯 Resumo do Teste:")
    print(f"   Créditos iniciais: {initial_credits}")
    print(f"   Créditos finais: {final_credits}")
    print(f"   Consumo: {'✅ OK' if final_credits == initial_credits - 1 else '❌ Falhou'}")
    print(f"   Assinatura: {'✅ Ativa' if status_data.get('has_active_plan') else '❌ Inativa'}")

if __name__ == "__main__":
    test_credits_flow()
