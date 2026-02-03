# Sistema de Monitoring e Alertas - Sentry

## Visão Geral

Sistema de tracking de erros e monitoramento de produção implementado com Sentry para alertas em tempo real sobre falhas críticas na API Vant.

## Configuração

### 1. Instalação da Dependência
```bash
pip install sentry-sdk[fastapi]
```

### 2. Variável de Ambiente
Adicionar ao arquivo `.env`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
ENVIRONMENT=production  # ou "development"
```

### 3. Obtenção do DSN
1. Criar conta gratuita em https://sentry.io (100k eventos/mês grátis)
2. Criar novo projeto
3. Selecionar "Python" como plataforma
4. Copiar o DSN fornecido

## Funcionalidades Implementadas

### ✅ Tracking Automático de Erros
- **Todos os endpoints** capturam exceções automaticamente
- **Contexto de usuário** adicionado quando disponível
- **Tags de endpoint** para filtragem fácil
- **Sanitização de PII** (dados sensíveis)

### ✅ Endpoints Monitorados
- `/api/analyze-lite` - Análise preview
- `/api/analyze-free` - Análise gratuita
- `/api/analyze-premium-paid` - Análise premium (paga)
- `/api/entitlements/activate` - Ativação de pagamentos
- `/api/stripe/create-checkout-session` - Criação checkout
- `/api/stripe/verify-checkout-session` - Verificação pagamento

### ✅ Contexto Adicionado
```python
# Contexto de usuário (quando disponível)
sentry_sdk.set_context("user", {"id": user_id})

# Tags para filtragem
sentry_sdk.set_tag("endpoint", "analyze_premium_paid")
```

## Configuração de Produção

### Sampling Rate
- **10% das requests** rastreadas (`traces_sample_rate=0.1`)
- Economiza quota do Sentry (100k eventos/mês grátis)
- Ajustável conforme necessidade

### Sanitização de Dados
```python
def sanitize_pii(event, hint):
    """Remove dados sensíveis dos logs."""
    if 'request' in event:
        if 'data' in event['request']:
            event['request']['data'] = '[REDACTED]'
    return event
```

## Fluxo de Alertas

### 1. Erro Detectado
```python
try:
    # Código do endpoint
    pass
except Exception as e:
    sentry_sdk.capture_exception(e)
    return JSONResponse(status_code=500, content={"error": str(e)})
```

### 2. Alerta no Sentry
- **Notificação instantânea** via email/slack
- **Contexto completo**: usuário, endpoint, stack trace
- **Agregação automática** de erros similares
- **Performance tracking** das requests

### 3. Ações Recomendadas
- **Erros críticos**: investigação imediata
- **Tendências**: análise de padrões
- **SLA**: monitoramento de uptime

## Dashboard Sentry

### Views Principais
- **Issues**: Lista de erros agrupados
- **Performance**: Tempo de resposta das APIs
- **Release Tracking**: Impacto de deploys
- **User Feedback**: Relatos de usuários

### Filtros Úteis
- `endpoint:analyze_premium_paid` - Erros na análise premium
- `environment:production` - Apenas produção
- `user.id:uuid` - Erros de usuário específico

## Configuração de Alertas

### 1. Regras de Notificação
- **Critical**: > 10 erros/minuto por 5 minutos
- **Warning**: Novo erro em produção
- **Info**: Performance degradation (> 2s)

### 2. Canais de Alerta
- **Email**: time@vant.app.br
- **Slack**: #alerts-vant (opcional)
- **SMS**: apenas para critical (opcional)

## Boas Práticas

### ✅ Faça
- Adicionar contexto em todos os endpoints
- Usar tags consistentes para filtragem
- Monitorar performance crítica
- Revisar alertas semanalmente

### ❌ Não Faça
- Enviar dados sensíveis (PII)
- Ignorar warnings recorrentes
- Deixar sampling rate muito alto
- Esquecer de configurar ambiente

## Troubleshooting

### Sentry não inicializa
```bash
# Verificar variável de ambiente
echo $SENTRY_DSN

# Verificar logs do backend
python start_server.py
```

### Erros não aparecem
1. Verificar se `SENTRY_DSN` está configurada
2. Confirmar que não está em modo DEV sem sampling
3. Checar se há erros de rede/firewall

### Performance impact
- Sampling rate de 10% = impacto mínimo
- Sanitização automática de PII
- Async reporting não bloqueante

## Custos

### Plano Gratuito
- **100k eventos/mês**
- **1 usuário**
- **Retenção 30 dias**
- **Suficiente para produção inicial**

### Plano Developer (se necessário)
- **500k eventos/mês**
- **5 usuários**
- **Retenção 90 dias**
- **~$26/mês**

## Próximos Passos

1. **Configurar conta Sentry** e obter DSN
2. **Adicionar variável de ambiente** no Render
3. **Testar integração** com erro intencional
4. **Configurar alertas** por email
5. **Monitorar dashboard** semanalmente

## Exemplo de Configuração Render

```bash
# Environment Variables
SENTRY_DSN=https://your-dsn@sentry.io/project-id
ENVIRONMENT=production
```

## Suporte

- **Documentação Sentry**: https://docs.sentry.io
- **FastAPI Integration**: https://docs.sentry.io/platforms/python/integrations/fastapi/
- **Time Vant**: canal #dev-alerts
