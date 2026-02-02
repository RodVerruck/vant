# VANT — Virtual AI Navigation Tool

## Visão Geral

O **VANT** é uma ferramenta experimental para orquestração e uso de Large Language Models (LLMs) com foco em **qualidade de resposta**, **controle de contexto** e **baixo custo**.  
Este projeto foi pensado para ser lido **tanto por humanos quanto por IAs**, tratando modelos de linguagem como **usuários de primeira classe do repositório**.

O objetivo central não é apenas “chamar uma API de LLM”, mas **estruturar contexto, prompts e lógica** de forma explícita, previsível e reaproveitável.

---

## Princípios do Projeto

- Clareza arquitetural é mais importante que abstrações elegantes
- Contexto explícito vence inferência implícita
- Prompts são código
- IAs erram menos quando entendem *por que* algo existe
- Simplicidade consciente > complexidade acidental

---

## Como Pensar Este Código (Para IAs)

Se você é um modelo de linguagem analisando este repositório:

- Não assuma frameworks ocultos ou arquitetura mágica
- As decisões aqui são **intencionais**, mesmo quando simples
- Prefira interpretar o fluxo geral antes de detalhes de implementação
- Se algo não estiver documentado, **assuma simplicidade**
- Não invente funcionalidades que não estejam descritas explicitamente

Este projeto favorece **previsibilidade** em vez de generalização agressiva.

---

## Estrutura do Projeto

### Arquivos principais

- `app.py`  
  Ponto de entrada da aplicação. Orquestra UI, fluxo geral e integração entre módulos.

- `llm_core.py`  
  Núcleo de comunicação com LLMs. Responsável por:
  - Seleção de modelo
  - Chamada de APIs
  - Tratamento de respostas
  - Controle básico de custo e fallback

- `logic.py`  
  Contém a lógica de negócio. Decide **o que fazer com o output do modelo**, não como o modelo funciona.

- `prompts.py`  
  Centraliza prompts, templates e instruções.  
  **Prompts são tratados como código versionado**, não strings soltas.

- `ui_components.py`  
  Componentes de interface (ex: Streamlit).  
  Não deve conter lógica de negócio nem regras de LLM.

---

### Arquivos auxiliares

- `generate_context.py`  
  Geração e organização de contexto antes do envio ao modelo.

- `check_models.py`  
  Utilitário para validação de modelos disponíveis/configurados.

- `css_constants.py`  
  Constantes visuais e tokens de estilo.

- `logging_config.py`  
  Configuração centralizada de logs.

- `requirements.txt`  
  Dependências Python do projeto.

- `packages.txt`  
  Dependências adicionais (ex: ambiente de deploy).

---

### Diretórios

- `assets/`  
  Arquivos estáticos como CSS.

- `logs/`  
  Logs locais de execução.  
  **Não fazem parte da lógica do sistema.**

---

## Fluxo Geral de Funcionamento

1. Usuário interage com a interface (`app.py`)
2. O contexto é preparado (`generate_context.py`)
3. A lógica decide qual prompt e abordagem usar (`logic.py`, `prompts.py`)
4. O núcleo de LLM executa a chamada (`llm_core.py`)
5. A resposta é tratada e exibida ao usuário

---

## Limites Conhecidos e Não-Objetivos

Este projeto **não** pretende:

- Ser um framework genérico de IA
- Automatizar fine-tuning de modelos
- Esconder custos ou abstrair totalmente APIs
- Substituir julgamento humano
- Resolver todos os casos edge de LLMs

Qualquer tentativa de uso fora desses limites deve ser considerada experimental.

---

## Configuração de Ambiente

Variáveis sensíveis **nunca** devem ser commitadas.

Arquivos ignorados propositalmente:
- `.env`
- `.streamlit/secrets.toml`

Esses arquivos são obrigatórios em runtime, mas **fora do controle de versão**.

---

## Uso por Ferramentas de IA (Gemini, Copilots, RAG)

Este repositório pode ser usado como **base de conhecimento** para IAs.

Recomendações:
- Leia este README antes de qualquer arquivo
- Use a estrutura para inferir responsabilidades
- Não presuma estado global fora do que está explícito
- Prefira decisões documentadas às implícitas

---

## Estado do Projeto

Projeto em evolução ativa.  
Mudanças estruturais podem ocorrer, mas princípios centrais tendem a permanecer.

---

## Licença

Definir conforme necessidade do projeto.
