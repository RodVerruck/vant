#!/usr/bin/env python3
"""
Teste rápido para validar correção de área forçada em RH
"""
import requests
import json

# URL do endpoint
url = "http://127.0.0.1:8000/api/analyze-lite"

# CV de exemplo (texto simples)
cv_text = """
JOÃO SILVA
Recrutador e Analista de RH

Experiência:
- Atuei como recrutador por 3 anos
- Gerenciei processo seletivo para vagas de tecnologia
- Treinei equipes de entrevistadores
- Desenvolvi programas de trainee

Contato:
joao@email.com
(11) 99999-9999
"""

# Vaga genérica com área forçada
job_description = "Busco oportunidades profissionais que valorizem minhas habilidades e experiência em gestão de pessoas."

# Dados para enviar
files = {
    'file': ('cv.txt', cv_text.encode(), 'text/plain')
}

data = {
    'job_description': job_description,
    'area_of_interest': 'rh_lideranca'  # Área forçada
}

print("🧪 Testando área forçada: RH/Liderança")
print("=" * 50)

try:
    response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        setor_detectado = result.get('analise_por_pilares', {}).get('setor_detectado', 'NÃO ENVIADO')
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"📍 Setor Detectado: {setor_detectado}")
        
        # Verificar se detectou RH corretamente
        if "RH" in setor_detectado or "RECURSOS HUMANOS" in setor_detectado:
            print("🎉 SUCESSO: Área RH detectada corretamente!")
        else:
            print("❌ FALHA: Área não foi detectada como RH")
            
        # Mostrar gaps identificados
        gap_1 = result.get('gap_1', {})
        gap_2 = result.get('gap_2', {})
        
        print("\n📋 Gaps identificados:")
        print(f"Gap 1: {gap_1.get('titulo', 'N/A')}")
        print(f"Gap 2: {gap_2.get('titulo', 'N/A')}")
        
        # Verificar se gaps são relevantes para RH
        gap1_titulo = gap_1.get('titulo', '').lower()
        gap2_titulo = gap_2.get('titulo', '').lower()
        
        rh_keywords = ['rh', 'recrutamento', 'seleção', 'treinamento', 'gestão', 'pessoas', 'liderança']
        
        gap1_rh = any(keyword in gap1_titulo for keyword in rh_keywords)
        gap2_rh = any(keyword in gap2_titulo for keyword in rh_keywords)
        
        if gap1_rh or gap2_rh:
            print("✅ Gaps relevantes para RH detectados")
        else:
            print("⚠️ Gaps podem não ser específicos para RH")
            
    else:
        print(f"❌ Erro: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

print("\n" + "=" * 50)
print("Teste concluído!")
