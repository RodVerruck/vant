"""
Teste rápido para validar se a área de interesse está sendo forçada corretamente
"""

import requests
import json

def test_area_forcing():
    """Testa se a área de interesse está sendo forçada corretamente"""
    
    base_url = "http://127.0.0.1:8000"
    
    # Criar um CV de teste simples
    test_cv_content = """
JOÃO DA SILVA
EXPERIÊNCIA PROFISSIONAL
Analista de Sistemas | Tech Corp | 2019-2023
- Desenvolvimento de sistemas em Python
- Manutenção de banco de dados
EDUCAÇÃO
Bacharel em Ciência da Computação
"""
    
    # Salvar em arquivo temporário
    with open("test_cv.txt", "w", encoding="utf-8") as f:
        f.write(test_cv_content)
    
    print("🧪 TESTANDO FORÇA DE ÁREA DE INTERESSE")
    print("=" * 60)
    
    # Testar diferentes áreas
    test_areas = [
        ("vendas_cs", "Vendas/CS"),
        ("marketing_growth", "Marketing/Growth"),
        ("rh_lideranca", "RH/Liderança"),
        ("financeiro_corp", "Financeiro/Corporativo")
    ]
    
    for area_key, area_name in test_areas:
        print(f"\n📋 Testando área: {area_name} ({area_key})")
        print("-" * 40)
        
        try:
            with open("test_cv.txt", "rb") as f:
                files = {"file": f}
                data = {
                    "job_description": "Busco oportunidades profissionais que valorizem minhas habilidades e experiência.",
                    "area_of_interest": area_key
                }
                
                response = requests.post(
                    f"{base_url}/api/analyze-lite",
                    files=files,
                    data=data,
                    timeout=30
                )
            
            if response.status_code == 200:
                result = response.json()
                setor_detectado = result.get("analise_por_pilares", {}).get("setor_detectado", "NÃO ENCONTRADO")
                print(f"✅ Status: {response.status_code}")
                print(f"🎯 Setor detectado: {setor_detectado}")
                
                # Verificar se o setor corresponde à área esperada
                expected_keywords = {
                    "vendas_cs": ["VENDAS", "CS", "CUSTOMER SUCCESS", "VENDAS/CS"],
                    "marketing_growth": ["MARKETING", "GROWTH", "MARKETING/GROWTH"],
                    "rh_lideranca": ["RH", "LIDERANÇA", "RH/LIDERANÇA"],
                    "financeiro_corp": ["FINANCEIRO", "CORPORATIVO", "FINANCEIRO/CORPORATIVO"]
                }
                
                keywords = expected_keywords.get(area_key, [])
                is_correct = any(keyword in setor_detectado.upper() for keyword in keywords)
                
                if is_correct:
                    print(f"✅ Área forçada CORRETAMENTE")
                else:
                    print(f"❌ Área não foi forçada corretamente")
                    print(f"   Esperado conter: {keywords}")
                    print(f"   Recebido: {setor_detectado}")
                
            else:
                print(f"❌ Erro: {response.status_code}")
                print(f"   Mensagem: {response.text}")
                
        except Exception as e:
            print(f"❌ Exceção: {e}")
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    # Limpar arquivo temporário
    import os
    if os.path.exists("test_cv.txt"):
        os.remove("test_cv.txt")

if __name__ == "__main__":
    test_area_forcing()
