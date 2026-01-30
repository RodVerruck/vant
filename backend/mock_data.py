# Mock data para modo de desenvolvimento
# Permite testar o fluxo sem gastar tokens de IA

MOCK_PREVIEW_DATA = {
    "nota_ats": 78,
    "pilares": {
        "densidade_palavras_chave": {
            "score": 75,
            "feedback": "Seu CV contém palavras-chave relevantes, mas pode melhorar a densidade.",
            "sugestoes": [
                "Adicione mais termos técnicos específicos da vaga",
                "Use sinônimos das palavras-chave principais",
                "Inclua certificações e tecnologias mencionadas na descrição"
            ]
        },
        "formatacao_ats": {
            "score": 82,
            "feedback": "Formatação compatível com ATS, com pequenos ajustes necessários.",
            "sugestoes": [
                "Evite tabelas complexas",
                "Use fontes padrão (Arial, Calibri)",
                "Mantenha estrutura de seções clara"
            ]
        },
        "experiencia_relevante": {
            "score": 80,
            "feedback": "Experiência alinhada com a vaga, destaque melhor suas conquistas.",
            "sugestoes": [
                "Quantifique resultados (%, R$, tempo)",
                "Use verbos de ação no início das frases",
                "Priorize experiências dos últimos 5 anos"
            ]
        }
    },
    "gaps_fatais": [
        {
            "titulo": "Falta certificação AWS",
            "descricao": "A vaga exige certificação AWS, mas não foi encontrada no CV.",
            "impacto": "alto",
            "solucao": "Adicione certificações relevantes ou mencione experiência prática com AWS."
        }
    ],
    "preview_html": """
    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="color: #1e293b; margin-bottom: 16px;">📊 Análise Preliminar</h3>
        <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
            <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 8px;">Score ATS</div>
            <div style="font-size: 2rem; font-weight: 700; color: #10b981;">78/100</div>
        </div>
        <div style="background: white; padding: 16px; border-radius: 6px;">
            <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 8px;">Status</div>
            <div style="font-size: 1rem; color: #1e293b;">✅ Aprovado com ressalvas</div>
        </div>
    </div>
    """
}

MOCK_PREMIUM_DATA = {
    "pilares": {
        "densidade_palavras_chave": {
            "score": 92,
            "feedback": "Excelente densidade de palavras-chave após otimização.",
            "sugestoes": []
        },
        "formatacao_ats": {
            "score": 95,
            "feedback": "Formatação 100% compatível com ATS.",
            "sugestoes": []
        },
        "experiencia_relevante": {
            "score": 90,
            "feedback": "Experiência perfeitamente alinhada com a vaga.",
            "sugestoes": []
        },
        "impacto_quantificado": {
            "score": 88,
            "feedback": "Resultados quantificados e destacados.",
            "sugestoes": []
        }
    },
    "gaps_fatais": [],
    "analise_comparativa": {
        "pontos_fortes": [
            "Experiência sólida em Python e FastAPI",
            "Histórico de liderança técnica",
            "Certificações relevantes"
        ],
        "diferenciais": [
            "Experiência com IA/ML",
            "Contribuições open source",
            "Inglês fluente"
        ],
        "areas_melhoria": []
    },
    "projetos_praticos": [
        {
            "titulo": "Sistema de Recomendação com ML",
            "descricao": "Desenvolva um sistema de recomendação usando Python e scikit-learn para demonstrar suas habilidades em ML.",
            "tecnologias": ["Python", "scikit-learn", "pandas", "FastAPI"],
            "tempo_estimado": "2-3 semanas",
            "impacto": "Alto - demonstra habilidades práticas em ML"
        }
    ],
    "perguntas_entrevista": [
        {
            "pergunta": "Como você lidaria com um sistema de alta disponibilidade que precisa processar milhões de requisições por dia?",
            "categoria": "Arquitetura",
            "dificuldade": "Alta",
            "resposta_sugerida": "Implementaria uma arquitetura baseada em microserviços com load balancing, cache distribuído (Redis), filas de mensagens (RabbitMQ/Kafka) e auto-scaling. Monitoraria com Prometheus/Grafana."
        }
    ],
    "simulacao_entrevista": {
        "perguntas": [
            "Conte sobre um projeto desafiador que você liderou",
            "Como você garante qualidade de código em sua equipe?",
            "Descreva sua experiência com CI/CD"
        ],
        "feedback": "Prepare exemplos concretos usando o método STAR (Situação, Tarefa, Ação, Resultado)"
    },
    "livros_recomendados": [
        {
            "titulo": "Clean Code",
            "autor": "Robert C. Martin",
            "relevancia": "Essencial para boas práticas de desenvolvimento",
            "link": "https://www.amazon.com.br/dp/8576082675"
        }
    ],
    "kit_hacker": {
        "xray_searches": [
            'site:linkedin.com/in/ "Senior Python Developer" "São Paulo"',
            'site:linkedin.com/in/ "Tech Lead" "FastAPI" "AWS"'
        ],
        "empresas_alvo": [
            "Nubank",
            "Stone",
            "Mercado Livre"
        ]
    },
    "cv_otimizado_html": """
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        <h1 style="color: #1e293b; margin-bottom: 8px;">João Silva</h1>
        <p style="color: #64748b; margin-bottom: 24px;">Senior Python Developer | Tech Lead</p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Resumo Profissional</h2>
        <p style="color: #334155; line-height: 1.6;">
            Desenvolvedor Python Sênior com 8+ anos de experiência em arquitetura de sistemas escaláveis, 
            liderança técnica e implementação de soluções baseadas em IA/ML. Especialista em FastAPI, 
            AWS e práticas DevOps.
        </p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Experiência Profissional</h2>
        <div style="margin-bottom: 24px;">
            <h3 style="color: #1e293b; margin-bottom: 4px;">Tech Lead | Empresa XYZ</h3>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">Jan 2022 - Presente</p>
            <ul style="color: #334155; line-height: 1.8;">
                <li>Liderou equipe de 6 desenvolvedores na migração de monolito para microserviços, reduzindo tempo de deploy em 70%</li>
                <li>Implementou pipeline CI/CD com GitHub Actions, aumentando frequência de releases em 300%</li>
                <li>Desenvolveu sistema de recomendação com ML que aumentou conversão em 25%</li>
            </ul>
        </div>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Habilidades Técnicas</h2>
        <p style="color: #334155; line-height: 1.6;">
            <strong>Linguagens:</strong> Python, JavaScript, SQL<br>
            <strong>Frameworks:</strong> FastAPI, Django, React<br>
            <strong>Cloud:</strong> AWS (EC2, S3, Lambda, RDS)<br>
            <strong>DevOps:</strong> Docker, Kubernetes, GitHub Actions, Terraform
        </p>
    </div>
    """
}
