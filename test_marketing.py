#!/usr/bin/env python3
"""
Teste específico para área marketing - validando Gap #1
"""
import requests
import json

# Teste específico para área marketing
url = 'http://127.0.0.1:8000/api/analyze-lite'

# CV com termos de TI (para testar se Gap #1 respeita área)
cv_text = '''
JOÃO SILVA
Especialista em Marketing Digital

Experiência:
- Gerenciei campanhas de SEO e SEM utilizando SQL para análise de dados
- Desenvolvi estratégias de conteúdo com Python para automação
- Utilizei ferramentas de TI para otimizar processos de marketing
- Analisei métricas com dashboards personalizados

Contato:
joao@email.com
(11) 99999-9999
'''

# Vaga genérica com área marketing forçada
job_description = 'Busco oportunidades profissionais que valorizem minhas habilidades e experiência.'

files = {
    'file': ('cv.txt', cv_text.encode(), 'text/plain')
}

data = {
    'job_description': job_description,
    'area_of_interest': 'marketing_growth'
}

print('🧪 Testando área Marketing com CV que contém termos TI')
print('=' * 60)

response = requests.post(url, files=files, data=data)
result = response.json()

setor = result.get('analise_por_pilares', {}).get('setor_detectado', 'N/A')
print(f'📍 Setor Detectado: {setor}')

gap1 = result.get('gap_1', {})
gap2 = result.get('gap_2', {})

print(f'Gap 1: {gap1.get("titulo", "N/A")}')
print(f'Gap 2: {gap2.get("titulo", "N/A")}')

# Verificar exemplo otimizado do Gap 1
exemplo_otimizado = gap1.get('exemplo_otimizado', '')
print(f'\nExemplo Otimizado Gap 1: {exemplo_otimizado}')

# Verificar se Gap #1 contém termos de TI (não deveria)
ti_terms = ['sql', 'python', 'javascript', 'api', 'banco de dados']
has_ti_terms = any(term in exemplo_otimizado.lower() for term in ti_terms)

print(f'❌ Gap #1 contém termos de TI: {has_ti_terms}')

# Verificar se Gap #2 tem termos de marketing
if 'termos_faltando' in gap2:
    termos = gap2['termos_faltando']
    marketing_terms = ['seo', 'sem', 'tráfego', 'conversão', 'funil', 'crm', 'mídias sociais']
    has_marketing_terms = any(term in ' '.join(termos).lower() for term in marketing_terms)
    print(f'✅ Gap #2 contém termos de marketing: {has_marketing_terms}')
    print(f'Termos faltando: {termos}')

print('\n' + '=' * 60)
print('Análise concluída!')
