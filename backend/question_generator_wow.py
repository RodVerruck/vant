"""
Gerador WOW de Perguntas de Entrevista - "O Entrevistador Vivo"

Este módulo substitui o banco de perguntas estático por um gerador dinâmico
que cria perguntas personalizadas em tempo real usando IA.
"""

import json
import logging
from typing import List, Dict, Any
from llm_core import call_llm

logger = logging.getLogger(__name__)

# Persona prompts para diferentes setores
PERSONA_PROMPTS = {
    "Tecnologia": """
Você é um Tech Lead cético e exigente de uma empresa de tecnologia unicórnio.
Você valoriza código limpo, arquitetura escalável e pensamento crítico.
Você não se impressiona com buzzwords, quer ver profundidade técnica real.
Sua comunicação é direta, mas justa. Você gosta de desafiar candidatos
para ver como eles pensam sob pressão.
""",

    "Financeiro": """
Você é um CFO experiente e conservador de um banco de investimento.
Você valoriza precisão, conformidade regulatória e gestão de risco.
Você é cético com promessas sem dados e exige exemplos concretos.
Sua comunicação é formal e precisa. Você testa o rigor analítico
e a capacidade de tomar decisões sob pressão.
""",

    "Marketing": """
Você é um CMO criativo e orientado a dados de uma startup de crescimento acelerado.
Você valoriza métricas, ROI e pensamento estratégico.
Você é cético com ideias sem métricas e quer ver impacto mensurável.
Sua comunicação é energética, mas exigente. Você testa o equilíbrio
entre criatividade e resultados de negócio.
""",

    "RH": """
Você é um Head de People estrategista e focado em cultura de uma empresa Fortune 500.
Você valoriza inteligência emocional, liderança e alinhamento cultural.
Você é cético com respostas genéricas e quer ver autenticidade.
Sua comunicação é empática, mas perspicaz. Você testa a capacidade
de lidar com pessoas complexas e construir times de alta performance.
""",

    "Vendas": """
Você é um VP de Vendas agressivo e orientado a resultados de uma empresa SaaS B2B.
Você valoriza negociação, resiliência e construção de relacionamento.
Você é cético com desculpas e quer ver resultados concretos.
Sua comunicação é direta e desafiadora. Você testa a capacidade
de superar objeções e fechar negócios complexos.
""",

    "Default": """
Você é um entrevistador experiente e exigente.
Você valoriza competência, clareza e pensamento estruturado.
Você é cético com respostas vagas e quer ver profundidade.
Sua comunicação é profissional e direta. Você testa a capacidade
do candidato de demonstrar valor real.
"""
}

def generate_dynamic_questions_wow(
    sector: str,
    gaps_fatais: List[Dict],
    job_description: str,
    mode: str = "mixed",
    difficulty: str = "médio",
    num_questions: int = 5
) -> List[Dict[str, Any]]:
    """
    Gera perguntas dinâmicas usando IA com persona específica do setor.
    
    Args:
        sector: Setor detectado (Tecnologia, Financeiro, etc.)
        gaps_fatais: Lista de gaps identificados no CV
        job_description: Descrição da vaga
        mode: Tipo de entrevista (technical, behavioral, mixed, pressure)
        difficulty: Nível de dificuldade (fácil, médio, difícil)
        num_questions: Número de perguntas a gerar
    
    Returns:
        Lista de perguntas geradas dinamicamente
    """
    
    # Selecionar persona baseada no setor
    persona = PERSONA_PROMPTS.get(sector, PERSONA_PROMPTS["Default"])
    
    # Preparar gaps de forma inteligente
    gaps_text = ""
    if gaps_fatais:
        gaps_list = []
        for gap in gaps_fatais[:3]:  # Limitar a 3 gaps mais críticos
            titulo = gap.get("titulo", "")
            descricao = gap.get("descricao", "")
            if titulo and "falta" not in titulo.lower():
                gaps_list.append(f"- {titulo}: {descricao}")
            elif titulo:
                # Transformar "Falta de X" em "Experiência limitada em X"
                clean_titulo = titulo.replace("Falta de", "Experiência limitada em").replace("Ausência de", "Experiência limitada em")
                gaps_list.append(f"- {clean_titulo}: {descricao}")
        gaps_text = "\n".join(gaps_list)
    
    # Ajustar prompt baseado no modo e dificuldade
    mode_instructions = {
        "technical": "Gere perguntas predominantemente técnicas que testem conhecimento prático.",
        "behavioral": "Gere perguntas comportamentais que testem soft skills e experiências passadas.",
        "pressure": "Gere perguntas situacionais sob pressão que testem reação a desafios.",
        "mixed": "Gere um mix equilibrado de perguntas técnicas e comportamentais."
    }
    
    difficulty_multipliers = {
        "fácil": "perguntas acessíveis que permitam o candidato brilhar",
        "médio": "perguntas desafiadoras mas justas",
        "difícil": "perguntas realmente difíceis que testem os limites do candidato"
    }
    
    # Prompt principal para o "Entrevistador Vivo"
    system_prompt = f"""
{persona}

Você está entrevistando um candidato para uma vaga no setor de {sector}.

CONTEXTO DA VAGA:
{job_description[:500]}...

PONTOS FRACOS IDENTIFICADOS NO CANDIDATO:
{gaps_text if gaps_text else "- Nenhum gap crítico identificado"}

INSTRUÇÕES:
1. {mode_instructions.get(mode, mode_instructions["mixed"])}
2. Crie {difficulty_multipliers.get(difficulty, difficulty_multipliers["médio"])}
3. Gere exatamente {num_questions} perguntas únicas
4. Cada pergunta deve tocar nos gaps identificados de forma profissional
5. Use linguagem natural, evite copiar literalmente os títulos dos gaps
6. Seja específico e contextual para o setor de {sector}

SAÍDA OBRIGATÓRIA (JSON):
[
    {{
        "text": "Pergunta completa e natural",
        "type": "tecnica|comportamental|situacional",
        "intent": "intenção por trás da pergunta",
        "focus": ["foco1", "foco2"],
        "difficulty": "fácil|médio|difícil"
    }}
]

NÃO inclua explicações fora do JSON. Apenas o JSON puro.
"""

    try:
        # Chamar a IA para gerar perguntas
        response = call_llm(
            system_prompt=system_prompt,
            payload="Gere as perguntas conforme solicitado.",
            agent_name="question_generator_wow"
        )
        
        logger.info(f"🔍 Resposta bruta da IA: {str(response)[:500]}...")
        
        # Tentar fazer parse do JSON
        questions = []
        
        if isinstance(response, dict):
            questions = response.get("questions", [])
        elif isinstance(response, list):
            # Se já for uma lista, usar diretamente
            questions = response
        elif isinstance(response, str):
            try:
                # Remover possíveis caracteres antes/depois do JSON
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response.replace('```json', '').replace('```', '').strip()
                
                questions = json.loads(cleaned_response)
                
                # Se o resultado não for uma lista, tentar extrair de um campo
                if not isinstance(questions, list):
                    if isinstance(questions, dict):
                        questions = questions.get("questions", [])
                    else:
                        questions = []
                        
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Erro no parse JSON: {e}")
                # Tentar extrair array do texto
                import re
                json_match = re.search(r'\[.*?\]', response, re.DOTALL)
                if json_match:
                    try:
                        questions = json.loads(json_match.group())
                        if not isinstance(questions, list):
                            questions = []
                    except:
                        questions = []
                else:
                    # Se não encontrar JSON, criar pergunta manual
                    questions = []
        else:
            questions = []
        
        # Validar e formatar perguntas
        formatted_questions = []
        for i, q in enumerate(questions[:num_questions]):
            formatted_questions.append({
                "id": i + 1,
                "text": q.get("text", f"Pergunta {i+1}"),
                "type": q.get("type", "comportamental"),
                "intent": q.get("intent", ""),
                "focus": q.get("focus", []),
                "difficulty": q.get("difficulty", difficulty),
                "max_duration": 90 if mode == "pressure" else 120,
                "sector": sector,
                "generated": True  # Marcar como gerado dinamicamente
            })
        
        logger.info(f"✅ Geradas {len(formatted_questions)} perguntas WOW para setor {sector}")
        return formatted_questions
        
    except Exception as e:
        logger.error(f"❌ Erro ao gerar perguntas WOW: {e}")
        # Fallback para perguntas básicas se a IA falhar
        return _generate_fallback_questions(sector, num_questions)


def _generate_fallback_questions(sector: str, num_questions: int) -> List[Dict[str, Any]]:
    """
    Gera perguntas básicas de fallback se a IA falhar.
    """
    fallback_questions = [
        {
            "text": f"Me conte sobre sua experiência mais relevante no setor de {sector}.",
            "type": "comportamental",
            "intent": "Avaliar experiência principal",
            "focus": ["experiência", "setor"]
        },
        {
            "text": f"Qual seria seu maior diferencial para uma vaga em {sector}?",
            "type": "comportamental", 
            "intent": "Avaliar autoconhecimento e valor",
            "focus": ["diferenciação", "valor"]
        },
        {
            "text": f"Descreva um desafio complexo que você superou na área de {sector}.",
            "type": "comportamental",
            "intent": "Avaliar resiliência e problem-solving",
            "focus": ["desafio", "resolução"]
        }
    ]
    
    formatted = []
    for i, q in enumerate(fallback_questions[:num_questions]):
        formatted.append({
            "id": i + 1,
            **q,
            "difficulty": "médio",
            "max_duration": 120,
            "sector": sector,
            "generated": False
        })
    
    return formatted


def generate_question_with_context(
    sector: str,
    specific_gap: Dict,
    job_context: str,
    question_type: str = "tecnica"
) -> Dict[str, Any]:
    """
    Gera uma pergunta ultra-específica para um gap identificado.
    """
    gap_title = specific_gap.get("titulo", "")
    gap_desc = specific_gap.get("descricao", "")
    
    persona = PERSONA_PROMPTS.get(sector, PERSONA_PROMPTS["Default"])
    
    system_prompt = f"""
{persona}

Gere UMA pergunta ultra-específica e provocativa para este gap:

GAP IDENTIFICADO:
- Título: {gap_title}
- Descrição: {gap_desc}

CONTEXTO DA VAGA:
{job_context[:300]}...

TIPO DE PERGUNTA: {question_type}

INSTRUÇÕES:
1. Seja direto e específico
2. Toque na "ferida" do gap de forma profissional
3. Exija exemplos concretos
4. Use linguagem natural do setor de {sector}

SAÍDA JSON:
{{
    "text": "Pergunta específica e provocativa",
    "type": "{question_type}",
    "intent": "intenção específica",
    "focus": ["foco1", "foco2"]
}}
"""
    
    try:
        response = call_llm(
            system_prompt=system_prompt,
            payload="Gere a pergunta conforme solicitado.",
            agent_name="gap_question_generator"
        )
        
        if isinstance(response, dict):
            return {
                "id": 1,
                **response,
                "max_duration": 120,
                "sector": sector,
                "generated": True
            }
        else:
            return _generate_fallback_gap_question(sector, specific_gap)
            
    except Exception as e:
        logger.error(f"❌ Erro ao gerar pergunta específica: {e}")
        return _generate_fallback_gap_question(sector, specific_gap)


def _generate_fallback_gap_question(sector: str, gap: Dict) -> Dict[str, Any]:
    """
    Fallback para pergunta sobre gap específico.
    """
    gap_title = gap.get("titulo", "").replace("Falta de", "experiência em")
    
    return {
        "id": 1,
        "text": f"Me dê um exemplo prático de como você desenvolveu sua {gap_title}.",
        "type": "comportamental",
        "intent": "Avaliar desenvolvimento do gap",
        "focus": ["exemplo", "desenvolvimento"],
        "max_duration": 120,
        "sector": sector,
        "generated": False
    }
