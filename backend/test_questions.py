from generate_questions_fixed import _generate_interview_questions_wow_fixed

# Testar com setor Financeiro
report_data_financeiro = {
    'setor_detectado': 'Financeiro',
    'gaps_fatais': [{'titulo': 'Falta de exemplos de projetos financeiros'}],
    'biblioteca_tecnica': [{'titulo': 'Análise Financeira Avançada'}]
}

questions_financeiro = _generate_interview_questions_wow_fixed(report_data_financeiro, 'technical', 'médio', [])
print('=== SETOR FINANCEIRO ===')
for q in questions_financeiro:
    print(f'- {q["text"]}')

print()

# Testar com setor Marketing
report_data_marketing = {
    'setor_detectado': 'Marketing',
    'gaps_fatais': [{'titulo': 'Falta de métricas de campanha'}],
    'biblioteca_tecnica': [{'titulo': 'Marketing Digital'}]
}

questions_marketing = _generate_interview_questions_wow_fixed(report_data_marketing, 'technical', 'médio', [])
print('=== SETOR MARKETING ===')
for q in questions_marketing:
    print(f'- {q["text"]}')

print()

# Testar com setor Tecnologia
report_data_tech = {
    'setor_detectado': 'Tecnologia',
    'gaps_fatais': [{'titulo': 'Falta de exemplos de projetos'}],
    'biblioteca_tecnica': [{'titulo': 'Clean Code'}]
}

questions_tech = _generate_interview_questions_wow_fixed(report_data_tech, 'technical', 'médio', [])
print('=== SETOR TECNOLOGIA ===')
for q in questions_tech:
    print(f'- {q["text"]}')
