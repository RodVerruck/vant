#!/usr/bin/env python3
"""
Teste específico para área financeira
"""
import requests
import json

# Teste específico para área financeira
url = 'http://127.0.0.1:8000/api/analyze-lite'

# CV com foco financeiro
cv_text = '''
MARIA SILVA
Analista Financeiro Sênior

Experiência:
- Gerenciei fluxo de caixa e demonstrativos financeiros
- Elaborei orçamentos e análise de custos
- Realizei auditorias internas e controles financeiros
- Monitorei KPIs financeiros e métricas de desempenho

Contato:
maria@email.com
(11) 99999-9999
'''

# Vaga genérica com área financeira forçada
job_description = 'Busco oportunidades profissionais que valorizem minhas habilidades e experiência.'

files = {
    'file': ('cv.txt', cv_text.encode(), 'text/plain')
}

data = {
    'job_description': job_description,
    'area_of_interest': 'financeiro_corp'
}

print('🧪 Testando área forçada: Financeiro/Corporativo')
print('=' * 60)

response = requests.post(url, files=files, data=data)
result = response.json()

setor = result.get('analise_por_pilares', {}).get('setor_detectado', 'N/A')
print(f'📍 Setor Detectado: {setor}')

gap1 = result.get('gap_1', {})
gap2 = result.get('gap_2', {})

print(f'Gap 1: {gap1.get("titulo", "N/A")}')
print(f'Gap 2: {gap2.get("titulo", "N/A")}')

if 'termos_faltando' in gap2:
    termos = gap2['termos_faltando']
    print(f'Termos faltando: {termos}')

# Verificar se são termos de finanças
financeiro_keywords = ['orçamento', 'fluxo de caixa', 'demonstrativos', 'kpis', 'auditoria', 'contábil', 'balanço', 'custos']
termos_financa = any(keyword in ' '.join(termos).lower() for keyword in financeiro_keywords)

print(f'Termos relevantes para finanças: {termos_financa}')

print('\nResposta completa:')
print(json.dumps(result, indent=2, ensure_ascii=False))
