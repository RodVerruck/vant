from typing import List, Dict

def _generate_interview_questions_wow_fixed(report_data: dict, mode: str, difficulty: str, focus_areas: List[str]) -> List[dict]:
    """
    Gera perguntas ultra-personalizadas baseadas nos gaps do CV e contexto completo.
    """
    sector = report_data.get("setor_detectado", "Tecnologia")
    experience_level = _detect_experience_level(report_data)
    gaps_fatais = report_data.get("gaps_fatais", [])
    biblioteca_tecnica = report_data.get("biblioteca_tecnica", [])
    
    # Extrair keywords do CV para personalização
    cv_text = report_data.get("cv_otimizado_completo", "")
    
    # Banco de perguntas WOW por modo e setor (EXPANDIDO)
    question_banks = {
        "warmup": {
            "Tecnologia": [
                {
                    "text": f"Qual foi sua maior conquista profissional recente e o que você aprendeu com ela?",
                    "type": "comportamental",
                    "context": "Seja específico e use números quando possível.",
                    "focus": ["confiança", "clareza"]
                },
                {
                    "text": "Como você descreveria seu estilo de trabalho em 3 palavras?",
                    "type": "comportamental",
                    "context": "Pense em como você colabora e resolve problemas.",
                    "focus": ["autoconhecimento", "comunicação"]
                },
                {
                    "text": "O que te motiva a buscar uma nova oportunidade profissional?",
                    "type": "comportamental",
                    "context": "Seja autêntico sobre suas aspirações.",
                    "focus": ["motivação", "carreira"]
                }
            ],
            "Financeiro": [
                {
                    "text": f"Como você otimizaria processos financeiros para reduzir custos operacionais?",
                    "type": "tecnica",
                    "context": "Fale sobre eficiência e controle de custos.",
                    "focus": ["eficiência", "análise"]
                },
                {
                    "text": "Descreva uma situação em que você identificou uma oportunidade de melhoria financeira.",
                    "type": "comportamental",
                    "context": "Use o método STAR para estruturar sua resposta.",
                    "focus": ["análise", "impacto"]
                },
                {
                    "text": "Como você garante a conformidade com regulamentações financeiras?",
                    "type": "comportamental",
                    "context": "Mencione controles internos e auditorias.",
                    "focus": ["compliance", "processos"]
                }
            ],
            "Marketing": [
                {
                    "text": f"Como você mediria o sucesso de uma campanha de marketing digital?",
                    "type": "tecnica",
                    "context": "Fale sobre métricas e KPIs.",
                    "focus": ["métricas", "análise"]
                },
                {
                    "text": "Descreva uma campanha que você liderou do início ao fim.",
                    "type": "comportamental",
                    "context": "Mostre planejamento e resultados.",
                    "focus": ["estratégia", "execução"]
                },
                {
                    "text": "Como você equilibra criatividade com objetivos de negócio?",
                    "type": "comportamental",
                    "context": "Fale sobre alinhamento com metas.",
                    "focus": ["equilíbrio", "estratégia"]
                }
            ],
            "RH": [
                {
                    "text": f"Como você lidaria com um caso de conflito entre funcionários?",
                    "type": "comportamental",
                    "context": "Mostre mediação e resolução.",
                    "focus": ["conflito", "mediação"]
                },
                {
                    "text": "Como você desenvolve talentos na sua equipe?",
                    "type": "comportamental",
                    "context": "Fale sobre coaching e desenvolvimento.",
                    "focus": ["liderança", "desenvolvimento"]
                },
                {
                    "text": "Como você garante a diversidade e inclusão no recrutamento?",
                    "type": "comportamental",
                    "context": "Mencione práticas e resultados.",
                    "focus": ["diversidade", "processos"]
                }
            ],
            "Vendas": [
                {
                    "text": f"Como você superaria uma objeção difícil de um cliente?",
                    "type": "comportamental",
                    "context": "Mostre persistência e persuasão.",
                    "focus": ["negociação", "resiliência"]
                },
                {
                    "text": "Descreva sua maior conquista de vendas.",
                    "type": "comportamental",
                    "context": "Use números e contexto específico.",
                    "focus": ["resultados", "estratégia"]
                },
                {
                    "text": "Como você constrói relacionamento com clientes?",
                    "type": "comportamental",
                    "context": "Fale sobre confiança e follow-up.",
                    "focus": ["relacionamento", "sucesso"]
                }
            ]
        },
        "technical": {
            "Tecnologia": [
                {
                    "text": f"Explique como você otimizaria o desempenho de uma aplicação que está lenta.",
                    "type": "tecnica",
                    "context": "Fale sobre diagnóstico, ferramentas e soluções.",
                    "focus": ["performance", "problem-solving"]
                },
                {
                    "text": "Como você garante a qualidade do código que produz?",
                    "type": "tecnica",
                    "context": "Mencione testes, code review e boas práticas.",
                    "focus": ["qualidade", "processos"]
                },
                {
                    "text": "Descreva um desafio técnico complexo que você superou.",
                    "type": "comportamental",
                    "context": "Use o método STAR para estruturar sua resposta.",
                    "focus": ["resiliência", "aprendizado"]
                }
            ],
            "Financeiro": [
                {
                    "text": f"Quais ferramentas financeiras você domina para análise e forecasting?",
                    "type": "tecnica",
                    "context": "Mencione Excel, BI, ou outras ferramentas.",
                    "focus": ["ferramentas", "análise"]
                },
                {
                    "text": f"Como você implementaria um sistema de controle interno?",
                    "type": "tecnica",
                    "context": "Fale sobre controles e processos.",
                    "focus": ["controles", "processos"]
                },
                {
                    "text": f"Explique a diferença entre IFRS e GAAP.",
                    "type": "tecnica",
                    "context": "Seja claro e direto na explicação.",
                    "focus": ["conhecimento", "padrões"]
                }
            ],
            "Marketing": [
                {
                    "text": f"Como você segmentaria o público para uma campanha?",
                    "type": "tecnica",
                    "context": "Fale sobre personas e canais.",
                    "focus": ["segmentação", "estratégia"]
                },
                {
                    "text": f"Quais métricas você usaria para avaliar o ROI de marketing?",
                    "type": "tecnica",
                    "context": "Mencione CAC, LTV, e outras métricas.",
                    "focus": ["métricas", "análise"]
                },
                {
                    "text": f"Como você otimizaria o funil de conversão?",
                    "type": "tecnica",
                    "context": "Fale sobre testes A/B e otimização.",
                    "focus": ["otimização", "conversão"]
                }
            ],
            "RH": [
                {
                    "text": f"Como você implementa programas de engajamento e retenção?",
                    "type": "tecnica",
                    "context": "Fale sobre estratégias e indicadores.",
                    "focus": ["engajamento", "retenção"]
                },
                {
                    "text": f"Quais sistemas de RH você já implementou?",
                    "type": "tecnica",
                    "context": "Mencione ATS, HRIS, ou outros sistemas.",
                    "focus": ["sistemas", "implementação"]
                },
                {
                    "text": f"Como você calcula o turnover rate e o impacto no negócio?",
                    "type": "tecnica",
                    "context": "Fale sobre cálculos e análise.",
                    "focus": ["análise", "métricas"]
                }
            ],
            "Vendas": [
                {
                    "text": f"Como você usa dados para prever metas de vendas?",
                    "type": "tecnica",
                    "context": "Fale sobre CRM e analytics.",
                    "focus": ["dados", "previsão"]
                },
                {
                    "text": f"Qual sua abordagem para qualificar leads?",
                    "type": "tecnica",
                    "context": "Fale sobre qualificação e scoring.",
                    "focus": ["qualificação", "processo"]
                },
                {
                    "text": f"Como você gerencia um pipeline de vendas complexo?",
                    "type": "tecnica",
                    "context": "Fale sobre etapas e conversão.",
                    "focus": ["pipeline", "gestão"]
                }
            ]
        },
        "behavioral": {
            "Tecnologia": [
                {
                    "text": f"Fale sobre uma situação em que você teve que lidar com um conflito na equipe.",
                    "type": "comportamental",
                    "context": "Foque em como você mediou e resolveu a situação.",
                    "focus": ["comunicação", "trabalho em equipe"]
                },
                {
                    "text": "Como você lida com feedback crítico sobre seu trabalho?",
                    "type": "comportamental",
                    "context": "Seja honesto sobre como você processa e aplica feedback.",
                    "focus": ["crescimento", "resiliência"]
                },
                {
                    "text": "Descreva um projeto em que você precisou influenciar outros sem autoridade formal.",
                    "type": "comportamental",
                    "context": "Mostre suas habilidades de persuasão e liderança.",
                    "focus": ["influência", "liderança"]
                }
            ],
            "Financeiro": [
                {
                    "text": f"Como você comunicaria más notícias financeiras para stakeholders?",
                    "type": "comportamental",
                    "context": "Foque em transparência e estratégia.",
                    "focus": ["comunicação", "gestão"]
                },
                {
                    "text": f"Descreva uma situação em que você precisou defender sua análise financeira.",
                    "type": "comportamental",
                    "context": "Mostre convicção e dados.",
                    "focus": ["defesa", "análise"]
                },
                {
                    "text": f"Como você negocia orçamentos com fornecedores?",
                    "type": "comportamental",
                    "context": "Foque em negociação e parceria.",
                    "focus": ["negociação", "relacionamento"]
                }
            ],
            "Marketing": [
                {
                    "text": f"Como você lidaria com uma campanha que não está performando bem?",
                    "type": "comportamental",
                    "context": "Foque em análise e ação corretiva.",
                    "focus": ["análise", "adaptação"]
                },
                {
                    "text": f"Descreva uma situação em que você precisou convencer outras equipes sobre uma estratégia.",
                    "type": "comportamental",
                    "context": "Mostre influência e comunicação.",
                    "focus": ["influência", "estratégia"]
                },
                {
                    "text": f"Como você lida com prazos apertados em projetos de marketing?",
                    "type": "comportamental",
                    "context": "Foque em gestão de tempo e expectativas.",
                    "focus": ["gestão", "priorização"]
                }
            ],
            "RH": [
                {
                    "text": f"Como você lidaria com um demitido?",
                    "type": "comportamental",
                    "context": "Foque em empatia e processo offboarding.",
                    "focus": ["empatia", "processos"]
                },
                {
                    "text": f"Descreva uma situação em que você precisou dar feedback difícil.",
                    "type": "comportamental",
                    "context": "Foque em clareza e desenvolvimento.",
                    "focus": ["feedback", "desenvolvimento"]
                },
                {
                    "text": f"Como você promove a cultura da empresa?",
                    "type": "comportamental",
                    "context": "Foque em valores e comportamento.",
                    "focus": ["cultura", "exemplo"]
                }
            ],
            "Vendas": [
                {
                    "text": f"Como você recuperaria um cliente perdido?",
                    "type": "comportamental",
                    "context": "Foque em persistência e valor.",
                    "focus": ["recuperação", "relacionamento"]
                },
                {
                    "text": f"Descreva uma situação em que você precisou ser criativo para fechar um negócio.",
                    "type": "comportamental",
                    "context": "Mostre criatividade e solução.",
                    "focus": ["criatividade", "solução"]
                },
                {
                    "text": f"Como você lida com a pressão de atingir metas ambiciosas?",
                    "type": "comportamental",
                    "context": "Foque em resiliência e estratégia.",
                    "focus": ["pressão", "metas"]
                }
            ]
        },
        "pressure": {
            "Tecnologia": [
                {
                    "text": f"Você tem 5 minutos para explicar por que deveríamos te contratar. Vamos!",
                    "type": "situacional",
                    "context": "Seja direto, confiante e impactante.",
                    "focus": ["rapidez", "impacto"]
                },
                {
                    "text": f"Seu sistema acabou de cair em produção. O que você faz AGORA?",
                    "type": "situacional",
                    "context": "Mostre calma, método e priorização.",
                    "focus": ["crise", "priorização"]
                },
                {
                    "text": f"Por que você é melhor que os outros candidatos para esta vaga?",
                    "type": "comportamental",
                    "context": "Seja confiante mas não arrogante. Use evidências.",
                    "focus": ["diferenciação", "confiança"]
                }
            ],
            "Financeiro": [
                {
                    "text": f"O mercado está volátil. Como você protegeria o orçamento?",
                    "type": "situacional",
                    "context": "Mostre estratégia e rapidez.",
                    "focus": ["crise", "estratégia"]
                },
                {
                    "text": f"Um cliente importante ameaça cancelar o contrato. O que você faz?",
                    "type": "situacional",
                    "context": "Mostre negociação e retenção.",
                    "focus": ["negociação", "crise"]
                },
                {
                    "text": f"Você tem 1 minuto para apresentar um relatório complexo. Vamos!",
                    "type": "situacional",
                    "context": "Seja direto, claro e impactante.",
                    "focus": ["rapidez", "comunicação"]
                }
            ],
            "Marketing": [
                {
                    "text": f"Sua campanha está falhando. O que você muda AGORA?",
                    "type": "situacional",
                    "context": "Mostre análise e ação rápida.",
                    "focus": ["análise", "adaptação"]
                },
                {
                    "text": f"O concorrente lançou uma campanha similar. Como você responde?",
                    "type": "situacional",
                    "context": "Mostre diferenciação e estratégia.",
                    "focus": ["diferenciação", "estratégia"]
                },
                {
                    "text": f"Você tem 2 minutos para pitchar uma nova ideia. Vamos!",
                    "type": "situacional",
                    "context": "Seja criativo e persuasivo.",
                    "focus": ["criatividade", "pitch"]
                }
            ],
            "RH": [
                {
                    "text": f"Há uma crise interna na equipe. Como você gerencia?",
                    "type": "situacional",
                    "context": "Mostre liderança e estabilidade.",
                    "focus": ["liderança", "crise"]
                },
                {
                    "text": f"Você precisa contratar 5 pessoas até amanhã. Como faz?",
                    "type": "situacional",
                    "context": "Mostre processo e critérios.",
                    "focus": ["recrutamento", "pressão"]
                },
                {
                    "text": f"Um funcionário chave ameaça sair. O que você oferece?",
                    "type": "situacional",
                    "context": "Mostre negociação e retenção.",
                    "focus": ["negociação", "retenção"]
                }
            ],
            "Vendas": [
                {
                    "text": f"Seu maior cliente cancelou o contrato. O que você faz?",
                    "type": "situacional",
                    "context": "Mostre resiliência e plano B.",
                    "focus": ["crise", "recuperação"]
                },
                {
                    "text": f"Você precisa bater a meta em 1 semana. Como faz?",
                    "type": "situacional",
                    "context": "Mostre estratégia e execução.",
                    "focus": ["metas", "pressão"]
                },
                {
                    "text": f"O concorrente está oferecendo o mesmo produto mais barato. Como você responde?",
                    "type": "situacional",
                    "context": "Mostre diferenciação e valor.",
                    "focus": ["diferenciação", "valor"]
                }
            ]
        },
        "company": {
            "Tecnologia": [
                {
                    "text": f"Por que você quer trabalhar especificamente nesta empresa de tecnologia?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisou sobre a empresa e cultura.",
                    "focus": ["pesquisa", "fit cultural"]
                },
                {
                    "text": "Como suas habilidades contribuem para os objetivos da empresa?",
                    "type": "situacional",
                    "context": "Conecte sua experiência com as necessidades da empresa.",
                    "focus": ["contribuição", "estratégia"]
                },
                {
                    "text": "Que tipo de ambiente de trabalho te faz mais produtivo?",
                    "type": "comportamental",
                    "context": "Seja honesto sobre seu estilo ideal de trabalho.",
                    "focus": ["cultura", "produtividade"]
                }
            ],
            "Financeiro": [
                {
                    "text": f"Por que você quer trabalhar no setor financeiro?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisa sobre o setor e tendências.",
                    "focus": ["pesquisa", "setor"]
                },
                {
                    "text": f"Como seu perfil se alinha com os valores da empresa?",
                    "type": "situacional",
                    "context": "Conecte sua experiência com a cultura.",
                    "focus": ["alinhamento", "valores"]
                },
                {
                    "text": f"O que você sabe sobre nossos produtos/serviços?",
                    "type": "comportamental",
                    "context": "Mostre conhecimento e interesse.",
                    "focus": ["conhecimento", "interesse"]
                }
            ],
            "Marketing": [
                {
                    "text": f"Por que você quer trabalhar no marketing desta marca?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisa sobre a marca e público.",
                    "focus": ["pesquisa", "marca"]
                },
                {
                    "text": f"Como sua experiência se conecta com nossa voz de marca?",
                    "type": "situacional",
                    "context": "Conecte seu portfólio com a identidade.",
                    "focus": ["alinhamento", "marca"]
                },
                {
                    "text": f"O que você sabe sobre nossos concorrentes?",
                    "type": "comportamental",
                    "context": "Mostre análise de mercado.",
                    "focus": ["análise", "concorrência"]
                }
            ],
            "RH": [
                {
                    "text": f"Por que você quer trabalhar com o time desta empresa?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisa sobre a cultura e time.",
                    "focus": ["pesquisa", "cultura"]
                },
                {
                    "text": f"Como seu estilo de liderança se encaixa na empresa?",
                    "type": "situacional",
                    "context": "Conecte seu estilo com a cultura.",
                    "focus": ["alinhamento", "liderança"]
                },
                {
                    "text": f"O que você sabe sobre nossos programas de desenvolvimento?",
                    "type": "comportamental",
                    "context": "Mostre interesse na empresa.",
                    "focus": ["desenvolvimento", "interesse"]
                }
            ],
            "Vendas": [
                {
                    "text": f"Por que você quer trabalhar com nossos produtos/serviços?",
                    "type": "comportamental",
                    "context": "Mostre que você pesquisa sobre a empresa.",
                    "focus": ["pesquisa", "produtos"]
                },
                {
                    "text": f"Como seu estilo de vendas se alinha com nossa abordagem?",
                    "type": "situal",
                    "context": "Conecte seu método com a empresa.",
                    "focus": ["alinhamento", "vendas"]
                },
                {
                    "text": f"O que você sabe sobre nossos clientes e mercado?",
                    "type": "comportamental",
                    "context": "Mostre conhecimento do negócio.",
                    "focus": ["clientes", "mercado"]
                }
            ]
        }
    }
    
    # Selecionar banco baseado no setor detectado
    mode_questions = question_banks.get(mode, question_banks["warmup"])
    sector_questions = mode_questions.get(sector, mode_questions["Tecnologia"])
    
    # Personalizar perguntas baseado nos gaps
    if gaps_fatais:
        gap_questions = []
        for gap in gaps_fatais[:2]:  # Máximo 2 perguntas sobre gaps
            gap_title = gap.get("titulo", "")
            if "exemplo" in gap_title.lower() or "projetos" in gap_title.lower():
                gap_questions.append({
                    "text": f"Me detalhe um projeto seu que demonstre {gap_title.lower()}",
                    "type": "comportamental",
                    "context": "Use exemplos concretos e resultados mensuráveis.",
                    "focus": ["exemplos", "resultados"]
                })
        
        # Substituir algumas perguntas genéricas pelas de gaps
        if gap_questions:
            sector_questions = sector_questions[:-len(gap_questions)] + gap_questions
    
    # Adicionar perguntas baseadas na biblioteca técnica
    if biblioteca_tecnica and mode in ["technical", "standard"]:
        tech_questions = []
        for book in biblioteca_tecnica[:1]:  # Máximo 1 pergunta sobre livros
            book_title = book.get("titulo", "")
            if book_title:
                tech_questions.append({
                    "text": f"Como os conceitos do livro '{book_title}' se aplicam ao seu trabalho?",
                    "type": "tecnica",
                    "context": "Mostre aplicação prática dos conceitos teóricos.",
                    "focus": ["aplicação", "conhecimento"]
                })
        
        # Adicionar pergunta técnica se houver espaço
        if tech_questions and len(sector_questions) < 5:
            sector_questions.extend(tech_questions)
    
    # Ajustar dificuldade
    if difficulty == "fácil":
        sector_questions = sector_questions[:3]  # Menos perguntas
    elif difficulty == "difícil":
        # Adicionar perguntas mais desafiadoras
        challenging_questions = [
            {
                "text": "Qual seria a arquitetura que você proporia para um sistema com 1M de usuários?",
                "type": "tecnica",
                "context": "Pense em escalabilidade, performance e custos.",
                "focus": ["arquitetura", "escalabilidade"]
            }
        ]
        sector_questions.extend(challenging_questions[:1])
    
    # Retornar perguntas finais com IDs e duração
    return [
        {
            "id": i + 1,
            **q,
            "max_duration": 90 if mode == "pressure" else 120
        }
        for i, q in enumerate(sector_questions[:5])  # Máximo 5 perguntas
    ]


def _detect_experience_level(report_data: dict) -> str:
    """
    Detecta nível de experiência baseado no CV.
    """
    cv_text = report_data.get("cv_otimizado_completo", "")
    
    # Keywords por nível
    senior_keywords = ["sênior", "senior", "lead", "architect", "10+", "8+", "9+"]
    pleno_keywords = ["pleno", "middle", "3+", "4+", "5+", "6+", "7+"]
    junior_keywords = ["junior", "estágio", "trainee", "1+", "2+"]
    
    if any(keyword in cv_text for keyword in senior_keywords):
        return "senior"
    elif any(keyword in cv_text for keyword in pleno_keywords):
        return "pleno"
    else:
        return "junior"
