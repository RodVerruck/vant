"""
Banco de perguntas para entrevista - otimização de performance
Constante externa para evitar recriação do dicionário a cada chamada
"""

QUESTION_BANKS = {
    "warmup": {
        "Tecnologia": [
            {
                "text": "Qual foi sua maior conquista profissional recente e o que você aprendeu com ela?",
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
        ]
    },
    "technical": {
        "Tecnologia": [
            {
                "text": "Explique como você otimizaria o desempenho de uma aplicação que está lenta.",
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
        ]
    },
    "behavioral": {
        "Tecnologia": [
            {
                "text": "Fale sobre uma situação em que você teve que lidar com um conflito na equipe.",
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
        ]
    },
    "pressure": {
        "Tecnologia": [
            {
                "text": "Você tem 5 minutos para explicar por que deveríamos te contratar. Vamos!",
                "type": "situacional",
                "context": "Seja direto, confiante e impactante.",
                "focus": ["rapidez", "impacto"]
            },
            {
                "text": "Seu sistema acabou de cair em produção. O que você faz AGORA?",
                "type": "situacional",
                "context": "Mostre calma, método e priorização.",
                "focus": ["crise", "priorização"]
            },
            {
                "text": "Por que você é melhor que os outros candidatos para esta vaga?",
                "type": "comportamental",
                "context": "Seja confiante mas não arrogante. Use evidências.",
                "focus": ["diferenciação", "confiança"]
            }
        ]
    },
    "company": {
        "Tecnologia": [
            {
                "text": "Por que você quer trabalhar especificamente nesta empresa?",
                "type": "comportamental",
                "context": "Mostre que você pesquisou sobre a empresa e cultura.",
                "focus": ["pesquisa", "fit cultural"]
            },
            {
                "text": "Como suas habilidades contribuiriam para os objetivos da empresa?",
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
        ]
    }
}

# Perguntas desafiadoras para modo difícil
CHALLENGING_QUESTIONS = [
    {
        "text": "Qual seria a arquitetura que você proporia para um sistema com 1M de usuários?",
        "type": "tecnica",
        "context": "Pense em escalabilidade, performance e custos.",
        "focus": ["arquitetura", "escalabilidade"]
    }
]
