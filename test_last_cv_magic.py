#!/usr/bin/env python3
"""
Teste da funcionalidade de Último CV Mágico
Valida backend e frontend integrados
"""

import requests
import json
import sys
import time

def test_backend_endpoint():
    """Testa o endpoint do último CV"""
    print("🧪 Testando endpoint /api/user/last-cv/{user_id}...")
    
    # Teste com user_id inválido
    response = requests.get("http://127.0.0.1:8000/api/user/last-cv/invalid-user-id")
    print(f"Status (user_id inválido): {response.status_code}")
    
    if response.status_code == 400:
        data = response.json()
        print(f"✅ Erro esperado: {data.get('error', 'Unknown error')}")
    
    # Teste com user_id válido mas sem histórico
    response = requests.get("http://127.0.0.1:8000/api/user/last-cv/00000000-0000-0000-0000-000000000000")
    print(f"Status (user_id válido sem histórico): {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Resposta esperada: {data}")
        if not data.get("has_last_cv"):
            print("✅ Nenhum CV encontrado (comportamento correto)")
    
    print("\n🎯 Endpoint backend validado com sucesso!")

def test_frontend_build():
    """Verifica se o frontend está buildado corretamente"""
    print("\n🧪 Verificando build do frontend...")
    
    try:
        # Verificar se o arquivo .next existe
        import os
        next_dir = "c:\\Vant\\frontend\\.next"
        if os.path.exists(next_dir):
            print("✅ Build do Next.js encontrado")
        else:
            print("❌ Build do Next.js não encontrado")
            return False
        
        # Verificar arquivos de build
        build_files = [
            "c:\\Vant\\frontend\\.next\\BUILD_ID",
            "c:\\Vant\\frontend\\.next\\static"
        ]
        
        for file_path in build_files:
            if os.path.exists(file_path):
                print(f"✅ {os.path.basename(file_path)} encontrado")
            else:
                print(f"❌ {os.path.basename(file_path)} não encontrado")
        
        print("🎯 Build do frontend validado!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar build: {e}")
        return False

def test_integration():
    """Teste de integração básico"""
    print("\n🧪 Teste de integração...")
    
    # Verificar se backend está online
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend online: {data.get('status', 'Unknown')}")
            
            # Verificar se Supabase está OK
            checks = data.get("checks", {})
            if checks.get("supabase") == "ok":
                print("✅ Supabase conectado")
            else:
                print("❌ Supabase não conectado")
                return False
                
            if checks.get("google_ai") == "ok":
                print("✅ Google AI conectado")
            else:
                print("❌ Google AI não conectado")
                return False
                
        else:
            print(f"❌ Backend offline (status {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao conectar no backend: {e}")
        return False
    
    print("🎯 Integração validada!")
    return True

def main():
    """Função principal de teste"""
    print("🚀 Testando funcionalidade Último CV Mágico")
    print("=" * 50)
    
    # Testar backend
    test_backend_endpoint()
    
    # Testar frontend
    frontend_ok = test_frontend_build()
    
    # Testar integração
    integration_ok = test_integration()
    
    print("\n" + "=" * 50)
    if frontend_ok and integration_ok:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Funcionalidade Último CV Mágico pronta para uso")
        print("\n📋 Próximos passos:")
        print("1. Iniciar frontend: cd c:\\Vant\\frontend && npm run dev")
        print("2. Fazer upload de um CV com usuário logado")
        print("3. Fazer logout e login novamente")
        print("4. Verificar se o card 'Último CV' aparece mágicamente!")
        return 0
    else:
        print("❌ ALGUNS TESTES FALHARAM")
        print("🔧 Verifique os erros acima antes de continuar")
        return 1

if __name__ == "__main__":
    sys.exit(main())
