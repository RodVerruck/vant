# Configuração de Webhooks do Stripe - Vant

## 🚨 IMPORTÂNCIA CRÍTICA

Esta implementação resolve uma **falha de segurança financeira crítica** onde usuários podiam pagar e não receber créditos se fechassem o navegador durante o redirecionamento.

## Problema Resolvido

### Antes (Vulnerável)
- Usuário paga → Stripe redireciona para frontend → Frontend chama `/api/entitlements/activate`
- **RISCO**: Se usuário fechar navegador, pagamento é confirmado mas créditos nunca são ativados

### Depois (Seguro)
- Usuário paga → Stripe notifica backend via webhook → Backend ativa créditos diretamente
- **SEGURO**: Créditos são ativados independentemente do navegador do usuário

## Configuração Passo a Passo

### 1. Obter Webhook Secret

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://seu-backend-render.com/api/stripe/webhook`
   - **HTTP method**: `POST`
   - **Events to send**:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
4. Copie o **Signing secret** gerado (começa com `whsec_`)

### 2. Configurar Variável de Ambiente

No seu ambiente de produção (Render):

```bash
STRIPE_WEBHOOK_SECRET=whsec_COPIAR_AQUI_O_SECRET_REAL
```

### 3. Testar Webhook

#### Teste Local com ngrok

1. Instale ngrok:
```bash
npm install -g ngrok
```

2. Inicie ngrok para porta 8000:
```bash
ngrok http 8000
```

3. Copie a URL HTTPS do ngrok (ex: `https://abc123.ngrok.io`)

4. Configure webhook no Stripe apontando para:
```
https://abc123.ngrok.io/api/stripe/webhook
```

5. Inicie o backend local:
```bash
cd backend
python start_server.py
```

#### Teste com CLI do Stripe

1. Disparar evento de teste:
```bash
stripe trigger checkout.session.completed
```

2. Verificar logs:
```bash
# Deve ver logs como:
🔥 [WEBHOOK] Recebido evento: checkout.session.completed
✅ [WEBHOOK] Pagamento confirmado e créditos ativados
```

## Eventos Implementados

### 1. `checkout.session.completed`
- **Quando**: Pagamento inicial concluído
- **Ação**: Ativa assinatura ou créditos avulsos
- **Crítico**: Primeira ativação após pagamento

### 2. `invoice.payment_succeeded`
- **Quando**: Renovação de assinatura bem-sucedida
- **Ação**: Reset contador de uso mensal
- **Importante**: Mantém créditos ativos mês a mês

### 3. `customer.subscription.created`
- **Quando**: Assinatura criada (aguardando pagamento)
- **Ação**: Apenas log, aguarda checkout.completed
- **Informação**: Para debugging e monitoramento

## Fluxo de Segurança

### 1. Verificação de Assinatura
```python
# HMAC SHA256 verification
sig = hmac.new(webhook_secret, payload, hashlib.sha256).hexdigest()
```

### 2. Extração de User ID
```python
# Múltiplas fontes para robustez
user_id = metadata.get("user_id") or customer.metadata.get("user_id")
```

### 3. Ativação Idempotente
```python
# Usa mesma RPC do endpoint existente
response = supabase_admin.rpc("activate_subscription_rpc", params).execute()
```

## Monitoramento e Logs

### Logs Esperados
```
🔥 [WEBHOOK] Recebido evento: checkout.session.completed
🔥 [WEBHOOK] Ativando assinatura: user=abc-123, plan=pro_monthly
🔥 [WEBHOOK] Chamando RPC: {...}
✅ [WEBHOOK] Assinatura ativada com sucesso: user=abc-123
```

### Logs de Erro
```
❌ [WEBHOOK] User ID não encontrado na sessão: cs_123
❌ [WEBHOOK] Assinatura inválida: user=abc-123
❌ [WEBHOOK] Erro na RPC: Database constraint violated
```

### Sentry Integration
- Todos os erros de webhook são capturados
- Tags: `endpoint: stripe_webhook`
- Context: user_id, event_type, session_id

## Comportamento Esperado

### Cenário 1: Pagamento Bem-Sucedido
1. Usuário paga no Stripe
2. Stripe envia `checkout.session.completed`
3. **Webhook recebe e ativa créditos imediatamente**
4. Usuário pode fechar navegador - créditos já estão ativos
5. Frontend eventualmente redireciona e vê créditos ativos

### Cenário 2: Usuário Fecha Navegador
1. Usuário paga e fecha navegador imediatamente
2. Stripe ainda envia webhook para backend
3. **Webhook ativa créditos independentemente**
4. Quando usuário voltar ao site, créditos já estarão ativos

### Cenário 3: Falha no Frontend
1. Frontend tem erro ou está offline
2. Webhook ainda funciona e ativa créditos
3. **Zero dependência do frontend**

## Validação em Produção

### 1. Verificar Endpoint
```bash
curl -X POST https://seu-backend.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 2. Testar com Stripe CLI
```bash
# Em produção, usar eventos reais
stripe listen --forward-to https://seu-backend.com/api/stripe/webhook
```

### 3. Monitorar Logs
- Verificar eventos chegando
- Confirmar ativações bem-sucedidas
- Alertar sobre falhas

## Rollback Plan

Se algo der errado:

1. **Desativar webhook** no Stripe Dashboard
2. **Sistema volta** ao comportamento anterior (frontend-dependent)
3. **Investigar logs** para identificar problema
4. **Corrigir e reativar** quando seguro

## Performance e Escalabilidade

### Características
- **Processamento síncrono**: Webhook processa imediatamente
- **Idempotência**: Eventos duplicados não causam problemas
- **Fallback**: Se webhook falha, frontend ainda funciona
- **Monitoring**: Logs completos para debugging

### Limites
- **Timeout**: 30 segundos por evento (padrão Stripe)
- **Retries**: Stripe retenta 3 vezes em caso de falha
- **Rate limits**: Seguem limites da API Stripe

## Segurança Adicional

### 1. IP Whitelisting (Opcional)
```python
# Permitir apenas IPs do Stripe
STRIPE_IPS = ["54.187.175.192", "54.187.174.168", "54.187.175.80"]
```

### 2. Rate Limiting
```python
# Endpoint já protegido com rate limiting
@limiter.limit("100/minute")  # Generoso para webhooks
```

### 3. Validar Event Structure
```python
# Sempre validar estrutura antes de processar
required_fields = ["type", "data", "object"]
```

## Resumo

✅ **Problema crítico resolvido**: Pagamentos nunca mais serão perdidos
✅ **Independência do frontend**: Backend garante ativação
✅ **Segurança robusta**: Verificação HMAC SHA256
✅ **Monitoring completo**: Logs e Sentry integration
✅ **Fallback seguro**: Sistema continua funcionando se webhook falhar

Esta é uma implementação de **segurança financeira crítica** que protege tanto os usuários (que sempre receberão o que pagaram) quanto o negócio (que não terá perda de receita ou problemas de suporte).
