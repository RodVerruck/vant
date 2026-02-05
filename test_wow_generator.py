"""
Teste do Gerador WOW - "O Entrevistador Vivo"
"""

import sys
sys.path.append('backend')

from question_generator_wow import generate_dynamic_questions_wow, generate_question_with_context

# Teste 1: Tecnologia com gaps específicos
print("🚀 === TESTE 1: TECNOLOGIA (Tech Lead Cético) ===")
print()

tech_gaps = [
    {"titulo": "Falta de experiência com arquitetura de microsserviços", "descricao": "Não trabalhou com sistemas distribuídos complexos"},
    {"titulo": "Experiência limitada em cloud", "descricao": "Só usou AWS básico"}
]

tech_questions = generate_dynamic_questions_wow(
    sector="Tecnologia",
    gaps_fatais=tech_gaps,
    job_description="Vaga de Senior Software Engineer para fintech escalável",
    mode="mixed",
    difficulty="difícil",
    num_questions=3
)

for i, q in enumerate(tech_questions, 1):
    print(f"🔥 Pergunta {i}:")
    print(f"   Texto: {q['text']}")
    print(f"   Tipo: {q['type']}")
    print(f"   Intenção: {q['intent']}")
    print(f"   Foco: {', '.join(q['focus'])}")
    print()

print("-" * 80)
print()

# Teste 2: Financeiro com gaps específicos
print("💰 === TESTE 2: FINANCEIRO (CFO Conservador) ===")
print()

finance_gaps = [
    {"titulo": "Falta de experiência com IFRS", "descricao": "Só trabalhou com padrões locais"},
    {"titulo": "Experiência limitada em modelagem financeira", "descricao": "Nunca construiu modelos complexos"}
]

finance_questions = generate_dynamic_questions_wow(
    sector="Financeiro",
    gaps_fatais=finance_gaps,
    job_description="Vaga de Analista Financeiro Sênior para banco multinacional",
    mode="technical",
    difficulty="médio",
    num_questions=3
)

for i, q in enumerate(finance_questions, 1):
    print(f"🎯 Pergunta {i}:")
    print(f"   Texto: {q['text']}")
    print(f"   Tipo: {q['type']}")
    print(f"   Intenção: {q['intent']}")
    print(f"   Foco: {', '.join(q['focus'])}")
    print()

print("-" * 80)
print()

# Teste 3: Pergunta ultra-específica para gap
print("⚡ === TESTE 3: PERGUNTA ULTRA-ESPECÍFICA ===")
print()

specific_question = generate_question_with_context(
    sector="Marketing",
    specific_gap={
        "titulo": "Falta de experiência com marketing de performance",
        "descricao": "Só trabalhou com marketing institucional"
    },
    job_context="Vaga de Performance Marketing Manager para startup B2B SaaS",
    question_type="situacional"
)

print(f"💥 Pergunta Específica:")
print(f"   Texto: {specific_question['text']}")
print(f"   Tipo: {specific_question['type']}")
print(f"   Intenção: {specific_question['intent']}")
print(f"   Foco: {', '.join(specific_question['focus'])}")
print()

print("-" * 80)
print()

# Teste 4: Marketing sob pressão
print("📈 === TESTE 4: MARKETING SOB PRESSÃO ===")
print()

marketing_questions = generate_dynamic_questions_wow(
    sector="Marketing",
    gaps_fatais=[
        {"titulo": "Falta de experiência com métricas de ROI", "descricao": "Nunca calculou retorno financeiro"}
    ],
    job_description="Vaga de Head de Marketing para empresa de crescimento acelerado",
    mode="pressure",
    difficulty="difícil",
    num_questions=2
)

for i, q in enumerate(marketing_questions, 1):
    print(f"🔥 Pergunta {i}:")
    print(f"   Texto: {q['text']}")
    print(f"   Tipo: {q['type']}")
    print(f"   Intenção: {q['intent']}")
    print(f"   Foco: {', '.join(q['focus'])}")
    print()

print("✅ === TESTE CONCLUÍDO! ===")
print("🎯 Compare com as perguntas antigas:")
print("   ANTIGO: 'Me detalhe um projeto seu que demonstre Falta de Experiência em React'")
print("   NOVO:  'Vi que você nunca liderou times formalmente, mas a vaga exige gestão. Me dê um exemplo prático de como você resolveu um conflito entre colegas sem ter autoridade hierárquica.'")
print()
print("🚀 ISSO É O EFEITO WOW!")
