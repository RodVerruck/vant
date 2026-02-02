# Guia de Configuração do Stripe - Modelo Simplificado

## 🎯 Produtos a Criar

Você precisa criar **6 produtos** no Stripe Dashboard.

---

## 📋 Passo a Passo

### 1. Acessar Stripe Dashboard

1. Acesse: https://dashboard.stripe.com
2. Faça login
3. Vá em **Products** → **Add Product**

---

### 2. Criar Produto: PRO Mensal

**Informações do Produto:**
- **Name:** Vant PRO Mensal
- **Description:** Otimizações ilimitadas de currículo com IA

**Pricing:**
- **Price:** R$ 27,90
- **Billing period:** Monthly (Mensal)
- **Currency:** BRL (Real Brasileiro)

**Após criar:**
- Copie o **Price ID** (formato: `price_xxxxxxxxxxxxx`)

- Cole no `.env`: `STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxxxxxxxxxx`

---

### 3. Criar Produto: PRO Mensal Early Bird (Desconto Vitalício)

**Informações do Produto:**
- **Name:** Vant PRO Mensal (Early Bird)
- **Description:** Otimizações ilimitadas com desconto vitalício - Exclusivo para primeiros 100 clientes

**Pricing:**
- **Price:** R$ 19,90
- **Billing period:** Monthly (Mensal)
- **Currency:** BRL (Real Brasileiro)

**Configuração Especial:**
- Este é o plano com desconto vitalício prometido na oferta relâmpago
- Clientes que entrarem pelo Trial de R$ 1,99 serão convertidos para este plano
- Preço fixo de R$ 19,90/mês para sempre (em vez de R$ 27,90)

**Após criar:**
- Copie o **Price ID** (formato: `price_xxxxxxxxxxxxx`)
- Cole no `.env`: `STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD=price_1Sw6712VONQto1dcAyvBbAJI`

---

### 4. Criar Produto: PRO Anual

**Informações do Produto:**
- **Name:** Vant PRO Anual
- **Description:** Otimizações ilimitadas de currículo com IA (Plano Anual - Economize 29%)

**Pricing:**
- **Price:** R$ 239,00
- **Billing period:** Yearly (Anual)
- **Currency:** BRL (Real Brasileiro)

**Após criar:**
- Copie o **Price ID**
- Cole no `.env`: `STRIPE_PRICE_ID_PRO_ANNUAL=price_1Svn442VONQto1dcsz9fFSwt

---

### 5. Criar Produto: Trial 7 Dias

**Informações do Produto:**
- **Name:** Vant PRO Trial 7 Dias
- **Description:** Teste o Vant PRO por 7 dias - R$ 1,99

**Pricing:**
- **Price:** R$ 1,99
- **Billing period:** One-time (Pagamento único)
- **Currency:** BRL (Real Brasileiro)

**Configuração Especial:**
- Este produto será usado como "trial pago"
- Após 7 dias, o backend converterá automaticamente para PRO Mensal Early Bird (R$ 19,90/mês)
- Reembolso automático se cancelar em 48h (configurar via webhook)

**Após criar:**
- Copie o **Price ID**
- Cole no `.env`: `STRIPE_PRICE_ID_TRIAL=price_1Svn5V2VONQto1dcvIedZ67k

---

### 6. Criar Produto: Crédito Único

**Informações do Produto:**
- **Name:** Vant Crédito Único
- **Description:** 1 otimização completa de currículo

**Pricing:**
- **Price:** R$ 12,90
- **Billing period:** One-time (Pagamento único)
- **Currency:** BRL (Real Brasileiro)

**Após criar:**
- Copie o **Price ID**
- Cole no `.env`: `STRIPE_PRICE_ID_CREDIT_1=price_1Svn6a2VONQto1dc0gwY52J5

---

### 7. Criar Produto: Pacote 5 CVs

**Informações do Produto:**
- **Name:** Vant Pacote 5 CVs
- **Description:** 5 otimizações completas de currículo (Economize 22%)

**Pricing:**
- **Price:** R$ 49,90
- **Billing period:** One-time (Pagamento único)
- **Currency:** BRL (Real Brasileiro)

**Após criar:**
- Copie o **Price ID**
- Cole no `.env`: `STRIPE_PRICE_ID_CREDIT_5price_1Svn7e2VONQto1dcjPldCUse

---

## 🔧 Atualizar Arquivo .env

Após criar todos os produtos, seu arquivo `.env` deve ter:

```bash
# Stripe Secret Key
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # ou sk_live_xxxxxxxxxxxxx

# Novos Price IDs
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD=price_1Sw6712VONQto1dcAyvBbAJI
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TRIAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_CREDIT_1=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_CREDIT_5=price_xxxxxxxxxxxxx

# Legacy (manter para usuários existentes)
STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PREMIUM_PLUS=price_xxxxxxxxxxxxx

# Outras configurações
FRONTEND_CHECKOUT_RETURN_URL=http://localhost:3000/app
```

---

## ✅ Checklist de Verificação

Antes de testar, verifique:

- [ ] 6 produtos criados no Stripe (incluindo Early Bird)
- [ ] Todos os Price IDs copiados
- [ ] Arquivo `.env` atualizado
- [ ] Backend reiniciado (`python start_server.py`)
- [ ] Variáveis carregadas corretamente (verificar logs)

---

## 🧪 Testar Localmente

### 1. Usar Stripe Test Mode

No Stripe Dashboard:
- Certifique-se de estar em **Test Mode** (toggle no canto superior direito)
- Use cartões de teste do Stripe

**Cartões de Teste:**
```
Sucesso: 4242 4242 4242 4242
Falha: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

**Dados do Cartão:**
- **Número:** Um dos acima
- **Data:** Qualquer data futura (ex: 12/25)
- **CVC:** Qualquer 3 dígitos (ex: 123)
- **CEP:** Qualquer CEP (ex: 12345-678)

### 2. Testar Cada Fluxo

**Teste 1: Análise Gratuita**
```bash
1. Acesse http://localhost:3000
2. Upload CV + descrição vaga
3. Clique "Analisar Grátis"
4. Verifique resultado limitado
```

**Teste 2: Checkout PRO Mensal**
```bash
1. Clique "Ver Planos"
2. Selecione "PRO Mensal"
3. Preencha email
4. Checkout com cartão teste
5. Verifique ativação de créditos
```

**Teste 3: Checkout PRO Anual**
```bash
1. Toggle "Anual"
2. Selecione "PRO Anual"
3. Checkout com cartão teste
4. Verifique desconto aplicado
```

**Teste 4: Trial R$ 1,99**
```bash
1. Clique "Começar Trial"
2. Checkout com R$ 1,99
3. Verifique acesso PRO
4. Teste cancelamento em 48h
```

**Teste 5: Créditos Avulsos**
```bash
1. Clique "Comprar Créditos"
2. Selecione "1 CV" ou "5 CVs"
3. Checkout
4. Verifique créditos adicionados
```

---

## 🚀 Deploy em Produção

### 1. Mudar para Live Mode

No Stripe Dashboard:
1. Toggle para **Live Mode**
2. Criar os mesmos 5 produtos (agora em produção)
3. Copiar os novos Price IDs (começam com `price_live_`)

### 2. Atualizar Variáveis de Ambiente

**Render (Backend):**
1. Acesse: https://dashboard.render.com
2. Vá no seu serviço backend
3. Environment → Add Environment Variable
4. Adicione todos os `STRIPE_PRICE_ID_*` com valores de produção
5. Adicione `STRIPE_SECRET_KEY` com chave live (`sk_live_`)

**Vercel (Frontend):**
- Não precisa alterar (frontend não usa Price IDs diretamente)

### 3. Configurar Webhooks (Opcional)

Para receber notificações de eventos do Stripe:

1. Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint**
3. URL: `https://vant-vlgn.onrender.com/api/stripe/webhook`
4. Eventos a escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copie o **Signing Secret** (`whsec_xxxxx`)
6. Adicione no `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## 🐛 Troubleshooting

### Erro: "Invalid price ID"
**Causa:** Price ID incorreto ou não existe  
**Solução:** Verificar se Price ID foi copiado corretamente do Stripe

### Erro: "No such price"
**Causa:** Usando Price ID de test mode em live mode (ou vice-versa)  
**Solução:** Certificar-se de usar Price IDs do modo correto

### Erro: "Stripe not configured"
**Causa:** `STRIPE_SECRET_KEY` não definida  
**Solução:** Adicionar chave no `.env` e reiniciar backend

### Checkout não redireciona
**Causa:** `FRONTEND_CHECKOUT_RETURN_URL` incorreta  
**Solução:** Verificar URL no `.env` (deve ser URL completa com protocolo)

### Créditos não ativam após pagamento
**Causa:** Webhook não configurado ou falhou  
**Solução:** Verificar logs do backend e configurar webhook

---

## 📊 Monitoramento

### Métricas no Stripe Dashboard

Acompanhe:
1. **Payments** → Ver todos os pagamentos
2. **Subscriptions** → Ver assinaturas ativas
3. **Customers** → Ver clientes
4. **Revenue** → Gráficos de receita

### Logs Importantes

**Backend (Render):**
```bash
# Ver logs em tempo real
https://dashboard.render.com → Seu serviço → Logs
```

**Stripe:**
```bash
# Ver eventos
Stripe Dashboard → Developers → Events
```

---

## 💡 Dicas

### 1. Teste Extensivamente em Test Mode
Antes de ir para produção, teste todos os cenários possíveis.

### 2. Use Metadata
Adicione metadata aos produtos para rastreamento:
```json
{
  "plan_id": "pro_monthly",
  "features": "unlimited",
  "tier": "pro"
}
```

### 3. Configure Emails do Stripe
Stripe Dashboard → Settings → Emails
- Customize emails de confirmação
- Adicione logo da empresa
- Personalize mensagens

### 4. Ative Radar (Fraude)
Stripe Dashboard → Radar
- Proteção automática contra fraude
- Grátis até certo volume

---

## 📞 Suporte

**Documentação Stripe:**
- https://stripe.com/docs
- https://stripe.com/docs/billing/subscriptions/overview

**Suporte Stripe:**
- Chat ao vivo no dashboard
- Email: support@stripe.com

**Comunidade:**
- Stack Overflow: [stripe] tag
- Discord: Stripe Developers
