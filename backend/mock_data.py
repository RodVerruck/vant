# Mock data para modo de desenvolvimento
# Gerado automaticamente a partir de processamento real da IA
# Para atualizar: python backend/generate_mock_from_real.py

MOCK_PREVIEW_DATA = {
    "veredito": "ANÁLISE SUPERFICIAL (VERSÃO GRATUITA)",
    "nota_ats": 50,
    "analise_por_pilares": {
        "impacto": 45,
        "keywords": 50,
        "ats": 55,
        "setor_detectado": "GLOBAL_SOFT_SKILLS"
    },
    "gaps_fatais": [
        {
            "erro": "Análise Completa Bloqueada",
            "evidencia": "Você está vendo apenas 1 dos 4 gaps críticos identificados.",
            "correcao_sugerida": "Desbloqueie o diagnóstico completo para ver todos os problemas que estão impedindo sua aprovação."
        }
    ],
    "linkedin_headline": "🔒 [CONTEÚDO PREMIUM BLOQUEADO]",
    "resumo_otimizado": "🔒 [DISPONÍVEL APENAS NA VERSÃO PAGA]",
    "cv_otimizado_completo": "🔒",
    "kit_hacker": {
        "boolean_string": "🔒"
    },
    "biblioteca_tecnica": []
}

MOCK_PREMIUM_DATA = {
    "_vant_error": True,
    "message": "GOOGLE_API_KEY não configurada. Defina a variável de ambiente GOOGLE_API_KEY.",
    "agent": "library",
    "model": "gemini-2.0-flash",
    "cv_otimizado_completo": "GOOGLE_API_KEY não configurada. Defina a variável de ambiente GOOGLE_API_KEY."
}
