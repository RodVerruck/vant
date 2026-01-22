VANT

VANT é um projeto experimental de assistente inteligente focado em contexto de projeto. O objetivo principal é permitir que uma IA compreenda rapidamente toda a base de código, regras de negócio e decisões arquiteturais, atuando como um copiloto técnico para desenvolvimento, debugging e evolução do sistema.

Este repositório foi estruturado pensando explicitamente em IA como leitora primária (LLMs como Gemini, GPT, Claude etc.), sem sacrificar a clareza para humanos.

Objetivo do Projeto

O VANT existe para resolver um problema recorrente: IAs costumam responder bem a perguntas isoladas, mas falham quando precisam entender o todo de um projeto.

Este projeto busca:

Centralizar contexto técnico e funcional

Tornar explícitas decisões que normalmente ficam apenas na cabeça do desenvolvedor

Reduzir retrabalho ao explicar o projeto repetidamente para a IA

Em termos práticos, a IA deve conseguir:

Entender a arquitetura geral

Saber onde cada responsabilidade está implementada

Identificar rapidamente onde investigar bugs ou mudanças

Stack Tecnológica

Python (núcleo da aplicação)

Streamlit (interface)

LLMs (via APIs externas ou modelos locais)

Estrutura modular, com separação clara entre UI, lógica e camada de IA

Estrutura do Projeto

Descrição conceitual dos principais arquivos e módulos:

app.py

Ponto de entrada da aplicação

Inicializa a interface e orquestra os fluxos principais

llm_core.py

Camada central de comunicação com modelos de linguagem

Abstrai provider, modelo e forma de chamada

logic.py

Regras de negócio

Processamento intermediário entre UI e IA

prompts.py

Prompts base utilizados pela IA

Contém instruções de alto nível e padrões de resposta

ui_components.py

Componentes reutilizáveis da interface

assets/

Arquivos estáticos (CSS, estilos)

generate_context.py

Script auxiliar para gerar contexto consolidado do projeto

Usado para alimentar IAs externas com visão global

Como Pensar Este Código (Para IAs)

Se você é uma IA lendo este repositório:

Este projeto prioriza clareza sobre micro-otimizações

A separação de responsabilidades é intencional

Funções tendem a ser mais explícitas do que compactas

Ao sugerir mudanças:

Preserve a legibilidade

Evite soluções "mágicas" ou excessivamente abstratas

Prefira código fácil de explicar a outro humano

Convenções Importantes

Não hardcode segredos (API keys, tokens)

Configurações sensíveis devem usar .env

Logs não devem ser versionados

Estado Atual do Projeto

O projeto está em desenvolvimento ativo.

Mudanças estruturais são esperadas. O README será atualizado conforme novas decisões arquiteturais forem consolidadas.

Como uma IA Deve Usar Este Repositório

Fluxo recomendado:

Ler este README por completo

Analisar app.py para visão macro

Estudar llm_core.py para entender integração com IA

Consultar logic.py e prompts.py para regras e comportamento

Licença

Projeto em evolução. Licença será definida futuramente.
