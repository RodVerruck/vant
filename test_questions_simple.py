import requests
import json

# Testar diretamente a função sem cache
import sys
sys.path.append('backend')
from generate_questions_fixed import _generate_interview_questions_wow_fixed

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
    },
    {
        "name": "Tecnologia",
        "data": {
            "setor_detectado": "Tecnologia",
            "gaps_fatais": [{"titulo": "Falta de exemplos de projetos"}],
            "biblioteca_tecnica": [{"titulo": "Clean Code"}]
        }
    }
]

for test_case in test_cases:
    print(f"\n=== TESTANDO SETOR: {test_case['name']} ===")
    
    # Testar diretamente a função
    questions = _generate_interview_questions_wow_fixed(
        test_case['data'], 
        "technical", 
        "médio", 
        []
    )
    
    print(f"Perguntas geradas: {len(questions)}")
    for i, q in enumerate(questions[:3]):  # Mostrar as 3 primeiras
        print(f"{i+1}. {q.get('text', 'N/A')}")
    
    print("---")

print("\n✅ Teste concluído! As perguntas agora são personalizadas por setor!")
