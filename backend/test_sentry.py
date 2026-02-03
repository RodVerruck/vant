#!/usr/bin/env python3
"""
Script para testar integração do Sentry.
Gera um erro intencional para verificar se está funcionando.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de ambiente
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")

def test_sentry_integration():
    """Testa se Sentry está configurado e funcionando."""
    
    # Verificar se DSN está configurado
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    
    print("🔍 Testando integração do Sentry...")
    print(f"   Ambiente: {environment}")
    
    if not sentry_dsn or sentry_dsn == "COLE_AQUI_SEU_DSN_DO_SENTRY":
        print("❌ SENTRY_DSN não configurado!")
        print("   1. Copie o DSN do dashboard Sentry")
        print("   2. Cole no arquivo .env")
        print("   3. Execute este script novamente")
        return False
    
    print(f"✅ SENTRY_DSN configurado: {sentry_dsn[:20]}...")
    
    try:
        # Importar e inicializar Sentry
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FastApiIntegration()],
            traces_sample_rate=1.0,  # 100% para teste
            environment=environment,
        )
        
        print("✅ Sentry inicializado com sucesso!")
        
        # Gerar erro de teste
        print("🚨 Gerando erro de teste...")
        
        try:
            # Erro intencional para teste
            raise ValueError("Este é um erro de teste do Sentry Integration")
        except Exception as e:
            sentry_sdk.capture_exception(e)
            print("✅ Erro capturado e enviado para Sentry!")
            print("   Verifique o dashboard Sentry em alguns segundos")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erro ao importar Sentry: {e}")
        print("   Execute: pip install sentry-sdk[fastapi]")
        return False
    except Exception as e:
        print(f"❌ Erro ao inicializar Sentry: {e}")
        return False

def test_api_endpoint():
    """Testa se endpoints da API estão capturando erros."""
    
    print("\n🔍 Testando endpoints da API...")
    
    try:
        import requests
        import json
        
        # Fazer request para endpoint que dispara erro
        response = requests.post(
            "http://127.0.0.1:8000/api/test-sentry-error",
            timeout=5
        )
        
        if response.status_code == 500:
            print("✅ Endpoint de teste retornou erro 500 (esperado)")
            print("   Erro deve aparecer no dashboard Sentry")
            return True
        else:
            print(f"⚠️  Endpoint retornou status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Backend não está rodando em http://127.0.0.1:8000")
        print("   Inicie o backend com: python backend/start_server.py")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar endpoint: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TESTE DE INTEGRAÇÃO SENTRY")
    print("=" * 60)
    
    # Teste 1: Configuração básica
    sentry_ok = test_sentry_integration()
    
    # Teste 2: Endpoints API (se backend estiver rodando)
    if sentry_ok:
        test_api_endpoint()
    
    print("\n" + "=" * 60)
    if sentry_ok:
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("   Verifique o dashboard Sentry para ver os eventos")
    else:
        print("❌ TESTE FALHOU!")
        print("   Corrija os problemas acima e execute novamente")
    print("=" * 60)
