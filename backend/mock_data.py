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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px; color: white; margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; font-size: 1.8rem;">📊 Análise Preliminar do CV</h2>
            <p style="margin: 0; opacity: 0.9;">Modo de Desenvolvimento - Dados Mockados</p>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3.5rem; font-weight: 800; color: #10b981; margin-bottom: 8px;">78/100</div>
                <div style="font-size: 1.1rem; color: #64748b;">Score ATS</div>
                <div style="margin-top: 12px; padding: 8px 16px; background: #dcfce7; color: #166534; border-radius: 20px; display: inline-block; font-weight: 600;">
                    ✅ Aprovado com Ressalvas
                </div>
            </div>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-bottom: 20px; font-size: 1.3rem;">� Pilares de Análise</h3>
            
            <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">Densidade de Palavras-Chave</strong>
                    <span style="font-size: 1.2rem; font-weight: 700; color: #3b82f6;">75/100</span>
                </div>
                <p style="color: #64748b; margin: 8px 0; line-height: 1.6;">Seu CV contém palavras-chave relevantes, mas pode melhorar a densidade.</p>
            </div>
            
            <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #10b981; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">Formatação ATS</strong>
                    <span style="font-size: 1.2rem; font-weight: 700; color: #10b981;">82/100</span>
                </div>
                <p style="color: #64748b; margin: 8px 0; line-height: 1.6;">Formatação compatível com ATS, com pequenos ajustes necessários.</p>
            </div>
            
            <div style="padding: 16px; background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">Experiência Relevante</strong>
                    <span style="font-size: 1.2rem; font-weight: 700; color: #f59e0b;">80/100</span>
                </div>
                <p style="color: #64748b; margin: 8px 0; line-height: 1.6;">Experiência alinhada com a vaga, destaque melhor suas conquistas.</p>
            </div>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border: 2px solid #fca5a5; margin-bottom: 20px;">
            <h3 style="color: #991b1b; margin-bottom: 16px; font-size: 1.2rem;">⚠️ Gap Fatal Identificado</h3>
            <div style="background: white; padding: 16px; border-radius: 8px;">
                <strong style="color: #dc2626; display: block; margin-bottom: 8px;">Falta certificação AWS</strong>
                <p style="color: #64748b; margin: 8px 0; line-height: 1.6;">A vaga exige certificação AWS, mas não foi encontrada no CV.</p>
                <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 6px;">
                    <strong style="color: #166534; display: block; margin-bottom: 4px;">💡 Solução:</strong>
                    <p style="color: #166534; margin: 0;">Adicione certificações relevantes ou mencione experiência prática com AWS.</p>
                </div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; text-align: center; color: white;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.3rem;">🚀 Pronto para Desbloquear a Versão Premium?</h3>
            <p style="margin: 0 0 20px 0; opacity: 0.9; line-height: 1.6;">Receba seu CV otimizado, análise comparativa, simulação de entrevista e muito mais!</p>
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
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1e293b;">
        <h1 style="color: #1e293b; margin-bottom: 8px; font-size: 2.2rem;">Rodrigo Verruck</h1>
        <p style="color: #64748b; margin-bottom: 24px; font-size: 1.1rem;">Analista de Suporte Júnior | Especialista em Automação e Suporte Técnico</p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Resumo Profissional</h2>
        <p style="color: #334155; line-height: 1.6;">
            Profissional com sólida experiência em suporte técnico, automação de processos e desenvolvimento de soluções. 
            Histórico comprovado em redução de custos operacionais, otimização de processos e prestação de suporte consultivo. 
            Expertise em Python, APIs, certificados digitais e documentação técnica.
        </p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Experiência Profissional</h2>
        
        <div style="margin-bottom: 28px;">
            <h3 style="color: #1e293b; margin-bottom: 4px; font-size: 1.2rem;">Analista de Suporte Júnior | <span style="color: #10b981;">X.Digital Brasil</span></h3>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">Janeiro de 2024 – Julho de 2024 (7 meses)</p>
            <ul style="color: #334155; line-height: 1.8; margin-left: 20px;">
                <li><strong>Automação Financeira:</strong> Desenvolvimento de script em Python para automação do controle financeiro via integração com APIs, resultando em redução de 20% no trabalho manual e otimização de processos.</li>
                <li><strong>Suporte Consultivo:</strong> Prestação de suporte técnico consultivo a clientes, garantindo a correta emissão e instalação de certificados digitais.</li>
                <li><strong>Documentação Técnica:</strong> Criação de guias e documentação técnica detalhada, padronizando soluções e facilitando o autoatendimento.</li>
                <li><strong>Otimização de Processos:</strong> Implementação de melhorias contínuas nos processos de atendimento técnico e validação de conformidades, elevando a eficiência operacional.</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 28px;">
            <h3 style="color: #1e293b; margin-bottom: 4px; font-size: 1.2rem;">Estagiário de Suporte | <span style="color: #10b981;">X.Digital Brasil</span></h3>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">Outubro de 2023 – Janeiro de 2024 (4 meses)</p>
            <ul style="color: #334155; line-height: 1.8; margin-left: 20px;">
                <li><strong>Automação Financeira:</strong> Desenvolvimento de script em Python para automação do controle financeiro via integração com APIs, resultando em redução de 20% no trabalho manual e otimização de processos.</li>
                <li><strong>Suporte Consultivo:</strong> Prestação de suporte técnico consultivo a clientes, garantindo a correta emissão e instalação de certificados digitais.</li>
                <li><strong>Documentação Técnica:</strong> Criação de guias e documentação técnica detalhada, padronizando soluções e facilitando o autoatendimento.</li>
                <li><strong>Otimização de Processos:</strong> Implementação de melhorias contínuas nos processos de atendimento técnico e validação de conformidades, elevando a eficiência operacional.</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 28px;">
            <h3 style="color: #1e293b; margin-bottom: 4px; font-size: 1.2rem;">Promotor de Vendas | <span style="color: #10b981;">SPAR Brasil</span></h3>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">Dezembro de 2020 – Outubro de 2023</p>
            <ul style="color: #334155; line-height: 1.8; margin-left: 20px;">
                <li><strong>Gestão de Relacionamento:</strong> Desenvolvimento e manutenção de relacionamentos com clientes, garantindo satisfação e fidelização.</li>
                <li><strong>Análise de Mercado:</strong> Monitoramento de tendências de mercado e comportamento do consumidor para otimização de estratégias de vendas.</li>
                <li><strong>Treinamento de Equipe:</strong> Capacitação de novos colaboradores em técnicas de vendas e atendimento ao cliente.</li>
                <li><strong>Gestão de Estoque:</strong> Controle e organização de produtos, garantindo disponibilidade e redução de perdas.</li>
            </ul>
        </div>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Formação Acadêmica</h2>
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-bottom: 4px; font-size: 1.1rem;">Bacharelado em Sistemas de Informação</h3>
            <p style="color: #64748b; font-size: 0.9rem;">Universidade Federal de Santa Catarina (UFSC) | 2020 - 2024</p>
        </div>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Habilidades Técnicas</h2>
        <p style="color: #334155; line-height: 1.6;">
            <strong>Linguagens:</strong> Python, JavaScript, SQL<br>
            <strong>Frameworks & Ferramentas:</strong> FastAPI, APIs REST, Git, Docker<br>
            <strong>Certificados Digitais:</strong> Emissão, instalação e suporte técnico<br>
            <strong>Automação:</strong> Scripts Python, integração de APIs, otimização de processos<br>
            <strong>Documentação:</strong> Criação de guias técnicos, padronização de soluções<br>
            <strong>Suporte:</strong> Atendimento consultivo, resolução de problemas técnicos
        </p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 32px;">Competências Comportamentais</h2>
        <p style="color: #334155; line-height: 1.6;">
            • Resolução de Problemas Complexos<br>
            • Comunicação Técnica Clara<br>
            • Trabalho em Equipe<br>
            • Aprendizado Contínuo<br>
            • Gestão de Tempo e Prioridades
        </p>
    </div>
    """
}
