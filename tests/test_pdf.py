import requests
import json

# Dados de teste para gerar PDF
test_data = {
    "veredito": "FORMATADO COMO SÊNIOR 👑",
    "nota_ats": 87,
    "analise_por_pilares": {
        "impacto": 90,
        "keywords": 85,
        "ats": 87,
        "setor_detectado": "TI_DADOS_AI"
    },
    "linkedin_headline": "Senior Python Developer | Django & PostgreSQL Specialist | 5+ Years Experience",
    "resumo_otimizado": "Desenvolvedor Senior com 5 anos de experiência em Python, Django e PostgreSQL. Especialista em desenvolvimento de APIs RESTful e arquitetura de microsserviços.",
    "cv_otimizado_completo": """JOÃO SILVA
Desenvolvedor Senior

RESUMO PROFISSIONAL
Desenvolvedor Senior com 5 anos de experiência em Python, Django e PostgreSQL. Especialista em desenvolvimento de APIs RESTful e arquitetura de microsserviços.

EXPERIÊNCIA PROFISSIONAL
Senior Python Developer | Tech Company | 2020 - Presente
- Liderança no desenvolvimento de APIs REST com Django REST Framework
- Implementação de arquitetura de microsserviços usando Docker e Kubernetes
- Otimização de consultas PostgreSQL, reduzindo latency em 40%
- Mentoring para equipe de 5 desenvolvedores júnior

Python Developer | StartupXYZ | 2018 - 2020
- Desenvolvimento de aplicações web com Django e Flask
- Integração com bancos de dados PostgreSQL e MongoDB
- Implementação de testes automatizados com pytest

COMPETÊNCIAS TÉCNICAS
- Linguagens: Python, JavaScript, TypeScript
- Frameworks: Django, Flask, React, Node.js
- Bancos: PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, AWS, CI/CD
- Outros: Git, Agile, Scrum

EDUCAÇÃO
Bacharel em Ciência da Computação | Universidade Federal | 2015 - 2020""",
    
    "gaps_fatais": [],
    "biblioteca_tecnica": [],
    "perguntas_entrevista": [],
    "kit_hacker": {"boolean_string": "python and django and postgresql"}
}

def test_pdf_generation():
    """Testa geração de PDF"""
    response = requests.post(
        "http://127.0.0.1:8000/api/generate-pdf",
        json={"data": test_data, "user_id": None}
    )
    
    if response.status_code == 200:
        with open("test_output.pdf", "wb") as f:
            f.write(response.content)
        print("✅ PDF gerado com sucesso! Salvo como test_output.pdf")
    else:
        print(f"❌ Erro ao gerar PDF: {response.status_code} - {response.text}")

def test_word_generation():
    """Testa geração de Word"""
    response = requests.post(
        "http://127.0.0.1:8000/api/generate-word",
        json={"data": test_data, "user_id": None}
    )
    
    if response.status_code == 200:
        with open("test_output.docx", "wb") as f:
            f.write(response.content)
        print("✅ Word gerado com sucesso! Salvo como test_output.docx")
    else:
        print(f"❌ Erro ao gerar Word: {response.status_code} - {response.text}")

if __name__ == "__main__":
    print("🧪 Testando geração de documentos...")
    test_pdf_generation()
    test_word_generation()
