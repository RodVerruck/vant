# Modelos de IA por Agente - Vant

## Data de Referência
3 de fevereiro de 2026

## Configuração Atual (GEMINI 2.5 FLASH-LITE)

### Todos os Agentes
- **Modelo**: `models/gemini-2.5-flash-lite` (Google)
- **API Key**: `GOOGLE_API_KEY`
- **Status**: ✅ Funcional e 50% mais barato

### Registry de Agentes (Atual)
```python
AGENT_MODEL_REGISTRY = {
    # TAREFAS CRÍTICAS (Qualidade):
    "cv_writer_semantic": "models/gemini-2.5-flash-lite", 

    # TAREFAS RÁPIDAS (Velocidade/Custo):
    # Usando Gemini 2.5 Flash-Lite (50% mais barato que Flash normal)
    "diagnosis": "models/gemini-2.5-flash-lite", 
    "cv_formatter": "models/gemini-2.5-flash-lite",
    "tactical": "models/gemini-2.5-flash-lite",
    "library": "models/gemini-2.5-flash-lite",
    
    # INTELIGENCE:
    "competitor_analysis": "models/gemini-2.5-flash-lite",
    "interview_evaluator": "models/gemini-2.5-flash-lite",
}

DEFAULT_MODEL = "models/gemini-2.5-flash-lite"
```

### Lista de Agentes e Funções

1. **cv_writer_semantic**: Agente escritor de CV (semântico)
2. **diagnosis**: Agente de diagnóstico rápido
3. **cv_formatter**: Agente formatador de CV (visual)
4. **tactical**: Agente de estratégias táticas
5. **library**: Agente curador de biblioteca técnica
6. **competitor_analysis**: Agente de análise de concorrentes
7. **interview_evaluator**: Agente avaliador de entrevista

### APIs Disponíveis
- **Groq**: Configurada no .env ✅
- **Gemini**: Configurada no .env (backup)
- **Claude**: Configurada no .env ✅ 

---

## Histórico de Mudanças (Fev/2026)

### Teste com Groq (21:55 - 22:15)
- **Modelo**: `groq/llama-3.3-70b-versatile`
- **Motivo**: Testar modelos gratuitos
- **Resultado**: ✅ Funcional, mas atingiu rate limit rapidamente
- **Problema**: Groq tem limites mais restritivos

### Retorno ao Gemini (22:15)
- **Modelo**: `models/gemini-2.5-flash`
- **Motivo**: Rate limit do Groq
- **Vantagem**: Mais estável e confiável
- **Custo**: Aceitável para volume de testes

### Mudança para Flash-Lite (22:39)
- **Modelo**: `models/gemini-2.5-flash-lite`
- **Motivo**: Economia de custos (50% mais barato)
- **Resultado**: ✅ Funcional e testado
- **Economia**: 50% de desconto vs Flash normal
- **Preços**: $0.0375/1M input, $0.15/1M output

---

## Configuração Original (ANTES da mudança)

### Todos os Agentes
- **Modelo**: `models/gemini-2.5-flash` (Google)
- **API Key**: `GOOGLE_API_KEY`
- **Status**: Ativo e funcional

### Registry de Agentes (Original)
```python
AGENT_MODEL_REGISTRY = {
    # TAREFAS CRÍTICAS (Qualidade):
    "cv_writer_semantic": "models/gemini-2.5-flash", 

    # TAREFAS RÁPIDAS (Velocidade/Custo):
    "diagnosis": "models/gemini-2.5-flash", 
    "cv_formatter": "models/gemini-2.5-flash",
    "tactical": "models/gemini-2.5-flash",
    "library": "models/gemini-2.5-flash",
    
    # INTELIGENCE:
    "competitor_analysis": "models/gemini-2.5-flash",
    "interview_evaluator": "models/gemini-2.5-flash",
}

DEFAULT_MODEL = "models/gemini-2.5-flash"
```

---

## Teste Realizado

### Data do Teste
3 de fevereiro de 2026 - 21:55

### Resultado
- **Sucesso total**: Groq Llama 3.3 funcionando perfeitamente
- **JSON parsing**: Sem erros de parse
- **Performance**: Resposta rápida
- **Qualidade**: Resultado coerente e estruturado

### Comando de Teste
```bash
cd backend && python start_server.py
curl http://127.0.0.1:8000/health
```

### Log do Teste
```
 Testando modelos Groq...
Modelo padrão: groq/llama-3.3-70b-versatile
 Testando agent_diagnosis com Groq...
 Sucesso! Resultado:
Tipo: <class 'dict'>
Keys: ['analise_por_pilares', 'nota_ats', 'veredito', 'gaps_fatais', 'resumo_otimizado', 'linkedin_headline']
Veredito: Aprovado com ressalvas
```

---

## Objetivo do Teste

1. **Validar compatibilidade**: Verificado se a mudança de JSON para Markdown permite usar modelos "piores"
2. **Avaliação de qualidade**: Groq Llama 3.3 produz resultados de alta qualidade
3. **Teste de custo**: Groq é gratuito vs Gemini pago
4. **Performance**: Tempo de resposta excelente

---

## Como Reverter

Para voltar à configuração original:
1. Editar `backend/llm_core.py`
2. Restaurar `AGENT_MODEL_REGISTRY` com modelos `models/gemini-2.5-flash`
3. Alterar `DEFAULT_MODEL` para `"models/gemini-2.5-flash"`
4. Reiniciar backend

---

## Implementação Técnica

### Função `_call_groq` Adicionada
- Suporte completo para modelos Groq
- Tratamento diferenciado para CV agents (texto) vs JSON agents
- Fallback estruturado para erros de JSON
- Remoção automática do prefixo "groq/" para API

### Modificação `call_llm`
- Detecção automática de modelos Groq
- Roteamento para `_call_groq` quando `model.startswith("groq")`

---

## Observações

- **Groq** usa modelos Llama 3.3 da Meta
- **Formato**: `groq/nome-do-modelo` no registry, `nome-do-modelo` na API
- **Limitações**: Performance similar ao Gemini em tarefas complexas
- **Vantagem**: 100% gratuito e rápido

---

## Próximos Passos

1. **Testes completos**: Validar todos os agentes com Groq
2. **Comparação de qualidade**: Gemini vs Groq lado a lado
3. **Decisão de produção**: Manter Groq ou voltar ao Gemini
4. **Documentação**: Atualizar guias de desenvolvimento
