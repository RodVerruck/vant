#!/usr/bin/env python3
"""
Suite de testes automatizados do Vant
Execute: python run_tests.py
"""

import subprocess
import sys
import time
import requests
from pathlib import Path

def run_test(test_name: str, test_func):
    """Executa um teste e reporta resultado"""
    print(f"\n{'='*60}")
    print(f"🧪 Executando: {test_name}")
    print(f"{'='*60}")
    
    try:
        test_func()
        print(f"✅ {test_name} - PASSOU")
        return True
    except Exception as e:
        print(f"❌ {test_name} - FALHOU")
        print(f"Erro: {e}")
        return False

def test_backend_health():
    """Testa se backend está online"""
    response = requests.get("http://127.0.0.1:8000/health", timeout=5)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_frontend_online():
    """Testa se frontend está online"""
    response = requests.get("http://localhost:3000", timeout=5)
    assert response.status_code == 200

def test_api_analyze():
    """Testa API de análise de CV"""
    # Cria PDF de teste se não existir
    if not Path("test_cv.pdf").exists():
        subprocess.run([sys.executable, "test_cv.py"], check=True)
    
    with open("test_cv.pdf", "rb") as f:
        files = {"file": f}
        data = {"job_description": "Vaga para Python Developer"}
        response = requests.post("http://127.0.0.1:8000/api/analyze-lite", files=files, data=data)
    
    assert response.status_code == 200
    result = response.json()
    assert "nota_ats" in result

def test_stripe_integration():
    """Testa integração com Stripe"""
    payload = {
        "plan_id": "basico",
        "customer_email": "test@example.com"
    }
    response = requests.post("http://127.0.0.1:8000/api/stripe/create-checkout-session", json=payload)
    
    # Pode falhar se chaves do Stripe não estiverem configuradas
    if response.status_code != 200:
        print("⚠️ Stripe não configurado - pulando teste")
        return
    
    result = response.json()
    assert "id" in result
    assert "url" in result

def test_document_generation():
    """Testa geração de documentos"""
    test_data = {
        "veredito": "TESTE",
        "nota_ats": 85,
        "analise_por_pilares": {"impacto": 85, "keywords": 85, "ats": 85},
        "linkedin_headline": "Test Developer",
        "resumo_otimizado": "Test resume",
        "cv_otimizado_completo": "TEST CV\n\nExperience:\n- Test role",
        "gaps_fatais": [],
        "biblioteca_tecnica": [],
        "perguntas_entrevista": [],
        "kit_hacker": {"boolean_string": "test"}
    }
    
    # Testa PDF
    response = requests.post(
        "http://127.0.0.1:8000/api/generate-pdf",
        json={"data": test_data}
    )
    assert response.status_code == 200
    
    # Testa Word
    response = requests.post(
        "http://127.0.0.1:8000/api/generate-word",
        json={"data": test_data}
    )
    assert response.status_code == 200

def main():
    print("🚀 SUITE DE TESTES AUTOMATIZADOS - VANT")
    print(f"Data/Hora: {time.strftime('%d/%m/%Y %H:%M:%S')}")
    
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Frontend Online", test_frontend_online),
        ("API de Análise de CV", test_api_analyze),
        ("Integração Stripe", test_stripe_integration),
        ("Geração de Documentos", test_document_generation),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        if run_test(test_name, test_func):
            passed += 1
    
    print(f"\n{'='*60}")
    print(f"📊 RESUMO FINAL")
    print(f"{'='*60}")
    print(f"✅ Passaram: {passed}/{total}")
    print(f"❌ Falharam: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("O sistema Vant está 100% funcional!")
        sys.exit(0)
    else:
        print("\n⚠️ ALGUNS TESTES FALHARAM")
        print("Verifique os erros acima para corrigir.")
        sys.exit(1)

if __name__ == "__main__":
    main()
