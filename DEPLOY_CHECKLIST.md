# 🚀 Checklist de Deploy para Produção

## ✅ Variáveis de Ambiente - Render (Backend)

Acesse: https://dashboard.render.com/web/srv-cujhvvggph6c73fqmvqg/env

### Variáveis OBRIGATÓRIAS para adicionar/atualizar:

```bash
# Nova variável para pacote 3 CVs
STRIPE_PRICE_ID_CREDIT_3=price_1Sw6Pi2VONQto1dc15S28ZmX

# CRÍTICO: IA deve processar de verdade em produção
DEV_MODE=false
```

### Variáveis que já devem estar configuradas (verificar):
- `GOOGLE_API_KEY` (IA real)
- `STRIPE_SECRET_KEY` (pagamentos reais - começa com sk_live_ ou sk_test_)
- `STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD`
- `STRIPE_PRICE_ID_TRIAL`
- `STRIPE_PRICE_ID_CREDIT_1`
- `STRIPE_PRICE_ID_CREDIT_5`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_CHECKOUT_RETURN_URL=https://vant.app.br/app`

---

## ✅ Passos para Deploy

### 1. Atualizar Render (Backend)
1. Acesse: https://dashboard.render.com
2. Vá em: Web Services → vant-vlgn
3. Clique em: Environment
4. Adicione: `STRIPE_PRICE_ID_CREDIT_3=price_1Sw6Pi2VONQto1dc15S28ZmX`
5. **IMPORTANTE**: Verifique se `DEV_MODE=false` (ou remova a variável)
6. Clique em: Save Changes
7. Aguarde o redeploy automático (~2-3 min)

### 2. Fazer Merge para Main
```bash
# Certifique-se de estar na branch dev
git checkout dev

# Faça pull para garantir que está atualizado
git pull origin dev

# Mude para a branch main
git checkout main

# Faça pull da main
git pull origin main

# Faça o merge da dev para main
git merge dev

# Envie para o repositório (dispara deploy automático)
git push origin main
```

### 3. Verificar Deploys Automáticos

**Vercel (Frontend):**
- URL: https://vercel.com/dashboard
- Deploy automático ao fazer push na main
- Tempo estimado: 1-2 minutos
- Site: https://vant.app.br

**Render (Backend):**
- URL: https://dashboard.render.com
- Deploy automático ao fazer push na main
- Tempo estimado: 2-3 minutos
- API: https://vant-vlgn.onrender.com

### 4. Testar em Produção

**Teste 1: Health Check**
- Acesse: https://vant-vlgn.onrender.com/health
- Deve retornar: `{"status": "ok"}`

**Teste 2: Frontend**
- Acesse: https://vant.app.br
- Faça upload de um CV
- Verifique se a análise funciona (IA real processando)

**Teste 3: Pricing**
- Verifique se os preços estão corretos:
  - 1 CV: R$ 12,90
  - 3 CVs: R$ 29,90
  - Trial: R$ 1,99

**Teste 4: Checkout (CRÍTICO)**
- Tente comprar o pacote de 3 CVs
- Verifique se redireciona para Stripe
- Complete o pagamento (use cartão real ou teste conforme ambiente)
- Verifique se retorna para o app após pagamento

---

## ⚠️ IMPORTANTE: Stripe em Produção

Se você estiver usando **chaves de teste** do Stripe (sk_test_...):
- Os pagamentos NÃO serão reais
- Use cartão teste: `4242 4242 4242 4242`

Se você estiver usando **chaves de produção** (sk_live_...):
- Os pagamentos SERÃO reais
- Use cartão real para testar
- Você pode fazer reembolso depois pelo dashboard do Stripe

---

## 🔄 Rollback (se algo der errado)

Se houver problemas após o deploy:

```bash
# Volte para a versão anterior na main
git checkout main
git reset --hard HEAD~1
git push origin main --force
```

Isso reverterá o deploy automático no Vercel e Render.

---

## 📝 Logs e Debugging

**Render Logs:**
- https://dashboard.render.com/web/srv-cujhvvggph6c73fqmvqg/logs

**Vercel Logs:**
- https://vercel.com/dashboard → Seu projeto → Deployments → Logs

**Erros comuns:**
- `DEV_MODE=true` em produção → IA não processa
- `STRIPE_PRICE_ID_CREDIT_3` ausente → Erro ao comprar pacote 3 CVs
- `FRONTEND_CHECKOUT_RETURN_URL` errado → Não retorna após pagamento
