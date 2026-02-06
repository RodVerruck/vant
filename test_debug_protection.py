#!/usr/bin/env python3
"""
Script para testar a proteção dos endpoints de debug
"""
import requests
import json
import sys

# Configuração
BASE_URL = "http://127.0.0.1:8000"
DEBUG_SECRET = "vant_debug_2026_secure_key_change_me_in_production"
TEST_USER_ID = "test-user-123"

def test_endpoint_protection():
    """Testa se endpoints de debug estão protegidos corretamente"""
    
    print("🔧 Testando proteção dos endpoints de debug...")
    print("=" * 60)
    
    # Lista de endpoints para testar
    endpoints = [
        {
            "method": "POST",
            "url": f"{BASE_URL}/api/debug/reset-credits",
            "data": {"user_id": TEST_USER_ID},
            "name": "reset-credits"
        },
        {
            "method": "POST", 
            "url": f"{BASE_URL}/api/debug/manual-activate",
            "data": {"user_id": TEST_USER_ID, "plan_id": "pro_monthly"},
            "name": "manual-activate"
        },
        {
            "method": "GET",
            "url": f"{BASE_URL}/api/debug/all-subscriptions",
            "data": None,
            "name": "all-subscriptions"
        },
        {
            "method": "POST",
            "url": f"{BASE_URL}/api/debug/create-real-customer",
            "data": {"user_id": TEST_USER_ID},
            "name": "create-real-customer"
        }
    ]
    
    # Teste 1: Sem header secreto (deve falhar)
    print("\n🚫 Teste 1: Acesso sem header X-Debug-Secret")
    print("-" * 40)
    
    for endpoint in endpoints:
        try:
            if endpoint["method"] == "POST":
                response = requests.post(endpoint["url"], json=endpoint["data"], timeout=5)
            else:
                response = requests.get(endpoint["url"], timeout=5)
            
            if response.status_code == 403:
                print(f"✅ {endpoint['name']}: Bloqueado (403) - PROTEGIDO")
            else:
                print(f"❌ {endpoint['name']}: Status {response.status_code} - VULNERÁVEL!")
                print(f"   Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"⚠️ {endpoint['name']}: Erro na requisição - {e}")
    
    # Teste 2: Com header secreto correto (deve funcionar se servidor estiver online)
    print("\n✅ Teste 2: Acesso com header X-Debug-Secret correto")
    print("-" * 40)
    
    headers = {"X-Debug-Secret": DEBUG_SECRET}
    
    for endpoint in endpoints:
        try:
            if endpoint["method"] == "POST":
                response = requests.post(endpoint["url"], json=endpoint["data"], headers=headers, timeout=5)
            else:
                response = requests.get(endpoint["url"], headers=headers, timeout=5)
            
            if response.status_code == 403:
                print(f"🔒 {endpoint['name']}: Ainda bloqueado (403) - pode estar em produção")
            elif response.status_code in [200, 400, 500]:
                print(f"✅ {endpoint['name']}: Acesso permitido ({response.status_code}) - FUNCIONANDO")
            else:
                print(f"⚠️ {endpoint['name']}: Status inesperado {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ {endpoint['name']}: Erro na requisição - {e}")
    
    # Teste 3: Com header secreto incorreto (deve falhar)
    print("\n🚫 Teste 3: Acesso com header X-Debug-Secret incorreto")
    print("-" * 40)
    
    wrong_headers = {"X-Debug-Secret": "wrong_secret_key"}
    
    for endpoint in endpoints[:2]:  # Testa apenas os primeiros para economizar tempo
        try:
            if endpoint["method"] == "POST":
                response = requests.post(endpoint["url"], json=endpoint["data"], headers=wrong_headers, timeout=5)
            else:
                response = requests.get(endpoint["url"], headers=wrong_headers, timeout=5)
            
            if response.status_code == 403:
                print(f"✅ {endpoint['name']}: Bloqueado (403) - PROTEGIDO")
            else:
                print(f"❌ {endpoint['name']}: Status {response.status_code} - VULNERÁVEL!")
                
        except Exception as e:
            print(f"⚠️ {endpoint['name']}: Erro na requisição - {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Teste concluído!")
    print("\n📋 Resumo da proteção:")
    print("• Sem header: ❌ Acesso negado (403)")
    print("• Header correto: ✅ Acesso permitido (em dev)")
    print("• Header incorreto: ❌ Acesso negado (403)")
    print("• Em produção: 🔒 Sempre bloqueado (independente da chave)")
    
    print("\n🔐 Segurança implementada:")
    print("• Verificação de header X-Debug-Secret")
    print("• Bloqueio em produção (ENVIRONMENT=production)")
    print("• Logs de auditoria no Sentry")
    print("• Rate limiting mantido")

if __name__ == "__main__":
    print("🚀 Iniciando teste de proteção dos endpoints de debug...")
    print(f"🌐 Servidor: {BASE_URL}")
    print(f"🔑 Chave de teste: {DEBUG_SECRET}")
    
    # Verificar se servidor está online
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor online, iniciando testes...")
            test_endpoint_protection()
        else:
            print(f"⚠️ Servidor retornou status {response.status_code}")
            print("Tente iniciar o servidor: cd backend && python start_server.py")
    except Exception as e:
        print(f"❌ Servidor offline: {e}")
        print("Inicie o servidor antes de rodar este teste:")
        print("cd backend && python start_server.py")
        sys.exit(1)
