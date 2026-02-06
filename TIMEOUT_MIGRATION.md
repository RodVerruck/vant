# Remoção de Middleware Global de Timeout - Vant Backend

## Data da Implementação
6 de fevereiro de 2026

## Problema Identificado
**Severidade**: CRÍTICO 🔴
**Categoria**: Arquitetura / Performance / Estabilidade

O middleware global de timeout usando `asyncio.wait_for` estava quebrando uploads de arquivos grandes e processamentos de IA demorados de forma abrupta.

## Causa Raiz
- Middleware global aplicava timeout de 180s a TODAS as requisições
- Uploads de arquivos grandes podem levar mais de 3 minutos
- Processamentos de IA (especialmente com múltiplos agentes) podem exceder 180s
- Timeout global não diferenciava entre tipos de operação

## Solução Implementada

### 1. Remoção do Middleware Global
**Arquivo**: `backend/main.py`

**ANTES (problema):**
```python
@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    """Timeout global de 180 segundos para todas as requests."""
    try:
        return await asyncio.wait_for(call_next(request), timeout=180.0)
    except asyncio.TimeoutError:
        logger.error(f"⏱️ Timeout na rota: {request.url.path}")
        return JSONResponse(
            status_code=504,
            content={"error": "Request timeout. Tente novamente em alguns instantes."}
        )
```

**DEPOIS (corrigido):**
```python
# Timeout global removido para não quebrar uploads de arquivos grandes
# Use timeouts específicos nas chamadas HTTP externas em vez de middleware global
```

### 2. Implementação de HTTP Client com Timeouts Específicos
**Arquivo**: `backend/http_client.py`

**Timeouts Configurados por Tipo:**
```python
TIMEOUTS = {
    "default": 30.0,      # Timeout padrão para APIs rápidas
    "upload": 300.0,      # Timeout para uploads de arquivos (5 minutos)
    "ia_processing": 600.0,  # Timeout para processamento de IA (10 minutos)
    "stripe": 60.0,       # Timeout para chamadas Stripe
    "supabase": 30.0,     # Timeout para chamadas Supabase
}
```

**Funções Disponíveis:**
- `get_with_timeout()` - GET com timeout configurado
- `post_with_timeout()` - POST com timeout configurado
- `get_with_timeout_sync()` - GET síncrono com timeout
- `post_with_timeout_sync()` - POST síncrono com timeout

### 3. Configuração do Servidor com Timeouts Apropriados
**Arquivo**: `backend/server_config.py`

**Configurações por Ambiente:**
```python
SERVER_CONFIGS = {
    "development": {
        "timeout_keep_alive": 65,      # Mantém conexão viva por 65s
        "timeout_graceful_shutdown": 30, # Tempo para shutdown gracefully
        "workers": 1,                   # 1 worker para development
        "reload": True,                  # Auto-reload em development
    },
    
    "production": {
        "timeout_keep_alive": 30,       # Mantém conexão viva por 30s
        "timeout_graceful_shutdown": 30, # Tempo para shutdown gracefully
        "workers": 3,                   # 3 workers para production
        "reload": False,                # Sem auto-reload em production
    }
}
```

### 4. Atualização do Script de Start
**Arquivo**: `backend/start_server.py`

**ANTES:**
```python
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
```

**DEPOIS:**
```python
from backend.server_config import run_server
run_server(environment)  # Usa configurações apropriadas
```

## Impacto na Estabilidade

### Antes (Frágil)
- ❌ Uploads grandes quebravam após 180s
- ❌ Processamentos IA interrompidos abruptamente
- ❌ Erro 504 genérico sem contexto
- ❌ Perda de trabalho do usuário

### Depois (Robusto)
- ✅ Uploads podem levar até 5 minutos
- ✅ Processamentos IA têm até 10 minutos
- ✅ Timeouts específicos por tipo de operação
- ✅ Erros contextuais e tratáveis

## Padrões Estabelecidos

### 1. Uso do HTTP Client
```python
# CORRETO:
from backend.http_client import post_with_timeout

result = await post_with_timeout(
    "https://api.stripe.com/...",
    timeout_type="stripe",  # Timeout específico
    json={...}
)

# INCORRETO (proibido):
# Não usar asyncio.wait_for globalmente
```

### 2. Timeouts por Operação
```python
# Uploads de arquivos
timeout_type="upload"  # 5 minutos

# Processamentos IA
timeout_type="ia_processing"  # 10 minutos

# APIs rápidas (Stripe, Supabase)
timeout_type="stripe"  # 60s
timeout_type="supabase"  # 30s

# Default
timeout_type="default"  # 30s
```

### 3. Configuração do Servidor
```python
# CORRETO:
from backend.server_config import run_server
run_server("production")  # Configurações otimizadas

# INCORRETO:
uvicorn.run("main:app", ...)  # Sem configurações específicas
```

## Exemplos de Uso

### Upload de Arquivo
```python
async def upload_large_file():
    return await post_with_timeout(
        "https://api.example.com/upload",
        timeout_type="upload",  # 5 minutos
        files={"file": file_data}
    )
```

### Processamento IA
```python
async def process_with_ai():
    return await post_with_timeout(
        "https://api.example.com/ai-process",
        timeout_type="ia_processing",  # 10 minutos
        json={"text": long_text}
    )
```

### API Stripe
```python
async def create_stripe_session():
    return await post_with_timeout(
        "https://api.stripe.com/v1/checkout/sessions",
        timeout_type="stripe",  # 60s
        data={...}
    )
```

## Validação

### Testes Realizados
✅ Upload de arquivo grande funciona sem timeout
✅ Processamento IA completo funciona sem interrupção
✅ APIs rápidas ainda têm timeout curto (30s)
✅ Server startup com configurações corretas

### Comportamento Esperado
- **Uploads**: Até 5 minutos sem erro
- **Processamentos IA**: Até 10 minutos sem erro
- **Chamadas externas**: Timeout específico por tipo
- **Servidor**: Configurações otimizadas por ambiente

## Arquivos Modificados

1. **backend/main.py** - Removido middleware global de timeout
2. **backend/http_client.py** - Novo módulo com timeouts específicos
3. **backend/server_config.py** - Configurações do servidor
4. **backend/start_server.py** - Atualizado para usar novas configurações
5. **requirements.txt** - Adicionada dependência httpx

## Arquivos Criados

1. **backend/http_client_examples.py** - Exemplos de uso
2. **TIMEOUT_MIGRATION.md** - Esta documentação

## Benefícios Alcançados

### Técnico
- 🏗️ **Arquitetura robusta**: Timeouts apropriados por operação
- 🔧 **Manutenibilidade**: Padrão claro para chamadas HTTP
- 📈 **Performance**: Sem interrupções abruptas
- 🛡️ **Estabilidade**: Uploads e processamentos concluídos

### Negócio
- 💰 **Confiabilidade**: Usuários não perdem trabalho
- 📊 **UX**: Uploads grandes funcionam
- 🔄 **Processamento**: Análises complexas completam
- 🎯 **Profissionalismo**: Sistema corporativo ready

## Próximos Passos

1. **Monitorar**: Logs de timeout em produção
2. **Ajustar**: Timeouts se necessário baseado em uso real
3. **Documentar**: Padrões para equipe de desenvolvimento
4. **Testar**: Carga com uploads grandes e processamentos longos

## Status Final
🚀 **Implementação 100% concluída**
✅ **Middleware global removido**
🔧 **Timeouts específicos implementados**
📊 **Servidor configurado corretamente**
🎯 **Produção ready**

## Lições Aprendidas

1. **Timeouts globais são anti-pattern** para operações heterogêneas
2. **Timeouts específicos** melhoram UX e estabilidade
3. **Configurações de servidor** devem ser por ambiente
4. **HTTP client centralizado** facilita manutenção
5. **Diferenciar operações** é chave para performance

 Tags: timeout, middleware, http_client, uploads, performance, stability, architecture
