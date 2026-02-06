#!/usr/bin/env python3
"""
Script para testar as correções das funções _entitlements_status e _consume_one_credit
Simula cenários com usuários novos que não têm registros no banco.
"""

import os
import sys
from pathlib import Path

# Adicionar backend ao path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def test_entitlements_status():
    """Testa a função _entitlements_status com diferentes cenários."""
    print("🧪 Testando _entitlements_status...")
    
    # Importar depois de configurar path
    from main import _entitlements_status
    
    # Cenário 1: user_id inválido
    print("\n1. Testando user_id inválido:")
    result = _entitlements_status("")
    expected = {"payment_verified": False, "credits_remaining": 0, "plan": None}
    assert result == expected, f"Esperado {expected}, got {result}"
    print("✅ Passou")
    
    # Cenário 2: user_id None
    print("\n2. Testando user_id None:")
    result = _entitlements_status(None)
    expected = {"payment_verified": False, "credits_remaining": 0, "plan": None}
    assert result == expected, f"Esperado {expected}, got {result}"
    print("✅ Passou")
    
    # Cenário 3: user_id válido mas sem registros (simulado)
    print("\n3. Testando user_id válido mas sem registros:")
    # Este teste vai falhar se não tiver Supabase configurado, mas não deve lançar exceção
    try:
        result = _entitlements_status("00000000-0000-0000-0000-000000000000")
        print(f"✅ Passou (sem exceção): {result}")
    except Exception as e:
        print(f"❌ Falhou com exceção: {e}")
        return False
    
    return True

def test_consume_one_credit():
    """Testa a função _consume_one_credit com diferentes cenários."""
    print("\n🧪 Testando _consume_one_credit...")
    
    from main import _consume_one_credit
    
    # Cenário 1: user_id inválido
    print("\n1. Testando user_id inválido:")
    try:
        _consume_one_credit("")
        print("❌ Deveria ter lançado exceção")
        return False
    except RuntimeError as e:
        if "Banco não configurado" in str(e):
            print("✅ Passou (lançou exceção esperada)")
        else:
            print(f"❌ Exceção inesperada: {e}")
            return False
    
    # Cenário 2: user_id None
    print("\n2. Testando user_id None:")
    try:
        _consume_one_credit(None)
        print("❌ Deveria ter lançado exceção")
        return False
    except RuntimeError as e:
        if "Banco não configurado" in str(e):
            print("✅ Passou (lançou exceção esperada)")
        else:
            print(f"❌ Exceção inesperada: {e}")
            return False
    
    # Cenário 3: user_id válido mas sem registros
    print("\n3. Testando user_id válido mas sem registros:")
    try:
        _consume_one_credit("00000000-0000-0000-0000-000000000000")
        print("❌ Deveria ter lançado exceção de 'Sem créditos'")
        return False
    except RuntimeError as e:
        if "Sem créditos" in str(e):
            print("✅ Passou (lançou exceção esperada)")
        else:
            print(f"❌ Exceção inesperada: {e}")
            return False
    except Exception as e:
        print(f"❌ Exceção inesperada: {e}")
        return False
    
    return True

def main():
    """Executa todos os testes."""
    print("=" * 60)
    print("🚀 TESTANDO CORREÇÕES - ERRO 500 USUÁRIOS NOVOS")
    print("=" * 60)
    
    # Carregar variáveis de ambiente
    from dotenv import load_dotenv
    PROJECT_ROOT = Path(__file__).parent
    load_dotenv(PROJECT_ROOT / ".env")
    
    success = True
    
    # Testar _entitlements_status
    if not test_entitlements_status():
        success = False
    
    # Testar _consume_one_credit
    if not test_consume_one_credit():
        success = False
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Correções implementadas com sucesso")
        print("✅ Sem risco de erro 500 com usuários novos")
    else:
        print("❌ ALGUNS TESTES FALHARAM")
        print("🔧 Verificar as correções implementadas")
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
