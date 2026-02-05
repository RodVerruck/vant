import requests
import json

# Testar com diferentes setores
test_cases = [
    {
        "name": "Financeiro",
        "data": {
            "setor_detectado": "Financeiro",
            "gaps_fatais": [{"titulo": "Falta de exemplos de projetos financeiros"}],
            "biblioteca_tecnica": [{"titulo": "Análise Financeira Avançada"}]
        }
    },
    {
        "name": "Marketing", 
        "data": {
            "setor_detectado": "Marketing",
            "gaps_fatais": [{"titulo": "Falta de métricas de campanha"}],
            "biblioteca_tecnica": [{"titulo": "Marketing Digital"}]
        }
    },
    {
        "name": "RH",
        "data": {
            "setor_detectado": "RH",
            "gaps_fatais": [{"titulo": "Falta de exemplos de liderança"}],
            "biblioteca_tecnica": [{"titulo": "Gestão de Pessoas"}]
        }
    }
]

for test_case in test_cases:
    print(f"\n=== TESTANDO SETOR: {test_case['name']} ===")
    
    # Simular dados no cache (mock)
    import sys
    sys.path.append('backend')
    from cache_manager import CacheManager
    
    cache_manager = CacheManager()
    cache_manager.save_to_cache(
        input_hash="test_hash",
        user_id="test_user",
        cv_text="CV de teste",
        job_description="Vaga de teste",
        result_json=test_case['data']
    )
    
    # Fazer requisição
    response = requests.post(
        "http://127.0.0.1:8000/api/interview/generate-questions",
        data={
            "cv_analysis_id": "test_hash",
            "mode": "technical",
            "difficulty": "médio"
        }
    )
    
    if response.status_code == 200:
        questions = response.json().get("questions", [])
        print(f"Status: {response.status_code}")
        print(f"Perguntas geradas: {len(questions)}")
        for i, q in enumerate(questions[:3]):  # Mostrar as 3 primeiras
            print(f"{i+1}. {q.get('text', 'N/A')}")
    else:
        print(f"Erro: {response.status_code}")
        print(f"Response: {response.text}")
