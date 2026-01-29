import requests
import json
import time

# URL base da API
BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Testa se o backend está online"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("✅ Backend online")

def test_analyze_lite():
    """Testa a análise gratuita"""
    with open("test_cv.pdf", "rb") as f:
        files = {"file": f}
        data = {"job_description": "Vaga para Desenvolvedor Python com experiência em Django e PostgreSQL"}
        response = requests.post(f"{BASE_URL}/api/analyze-lite", files=files, data=data)
    
    assert response.status_code == 200
    result = response.json()
    assert "nota_ats" in result
    assert "veredito" in result
    print(f"✅ Análise lite funcionou - Score ATS: {result['nota_ats']}")
    return result

def test_stripe_session():
    """Testa criação de sessão do Stripe"""
    payload = {
        "plan_id": "basico",
        "customer_email": "test@example.com",
        "score": 57
    }
    response = requests.post(f"{BASE_URL}/api/stripe/create-checkout-session", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        assert "url" in result
        print("✅ Sessão Stripe criada com sucesso")
        return result["id"]
    else:
        print(f"⚠️ Stripe session failed: {response.text}")
        return None

def main():
    print("🚀 Iniciando testes do fluxo Vant...")
    
    try:
        # Teste 1: Health check
        test_health()
        
        # Teste 2: Análise lite
        preview = test_analyze_lite()
        
        # Teste 3: Stripe (pode falhar se não tiver chaves)
        session_id = test_stripe_session()
        
        print("\n✅ Todos os testes básicos passaram!")
        print("\n📊 Resumo:")
        print(f"- Score ATS: {preview['nota_ats']}")
        print(f"- Veredito: {preview['veredito']}")
        print(f"- Setor detectado: {preview['analise_por_pilares'].get('setor_detectado', 'N/A')}")
        
    except Exception as e:
        print(f"\n❌ Erro nos testes: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
