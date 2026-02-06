#!/usr/bin/env python3
"""
Script para testar o endpoint do Stripe Customer Portal
"""
import requests
import json

# Configuração
API_URL = "http://127.0.0.1:8000"
TEST_USER_ID = "test-user-id"

def test_portal_endpoint():
    """Testa o endpoint do portal com diferentes cenários"""
    
    print("🧪 Testando endpoint do Stripe Customer Portal")
    print("=" * 50)
    
    # Teste 1: Usuário sem assinatura
    print("\n1. Testando com usuário sem assinatura...")
    response = requests.post(
        f"{API_URL}/api/stripe/create-portal-session",
        json={"user_id": "user-sem-assinatura"},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 404:
        print("✅ Correto: Retorna 404 para usuário sem assinatura")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Inesperado: {response.json()}")
    
    # Teste 2: Requisição inválida (sem user_id)
    print("\n2. Testando requisição inválida (sem user_id)...")
    response = requests.post(
        f"{API_URL}/api/stripe/create-portal-session",
        json={},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        print("✅ Correto: Retorna 400 para requisição inválida")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Inesperado: {response.json()}")
    
    # Teste 3: Verificar se endpoint existe
    print("\n3. Verificando se endpoint está acessível...")
    try:
        response = requests.get(f"{API_URL}/api/stripe/create-portal-session")
        print(f"Status: {response.status_code}")
        if response.status_code == 405:  # Method Not Allowed
            print("✅ Endpoint existe (mas só aceita POST)")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Para testar com usuário real:")
    print("1. Faça login na aplicação")
    print("2. Assine um plano")
    print("3. Clique no botão '⚙️ Gerenciar' no indicador de créditos")
    print("4. Deve redirecionar para o portal do Stripe")

if __name__ == "__main__":
    test_portal_endpoint()
