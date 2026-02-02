# Guia de Integração - Modelo Freemium

Este guia mostra como integrar o novo modelo freemium no frontend do Vant.

## 📋 Checklist de Implementação

### Backend ✅
- [x] Atualizar estrutura de pricing com 4 tiers
- [x] Criar endpoint `/api/analyze-free`
- [x] Adicionar tabela `free_usage` no banco
- [x] Configurar variáveis de ambiente

### Frontend 🔄
- [ ] Atualizar tipos TypeScript
- [ ] Integrar análise gratuita
- [ ] Adicionar componente PricingTiers
- [ ] Atualizar fluxo de stages
- [ ] Implementar post-payment flow
- [ ] Adicionar trust signals

---

## 1. Atualizar Tipos TypeScript

Adicione os novos tipos em `frontend/src/types/index.ts`:

```typescript
export type PlanType = "free" | "premium" | "pro" | "ultimate" | "basico" | "premium_plus";

export type AppStage = 
  | "upload"
  | "processing_free"      // Novo
  | "free_preview"         // Novo
  | "pricing"              // Novo
  | "processing_lite"
  | "preview"
  | "checkout"
  | "processing_premium"
  | "paid";

export interface PricingTier {
  id: PlanType;
  name: string;
  price: number;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}
```

---

## 2. Atualizar Fluxo Principal (page.tsx)

### 2.1 Adicionar Estado para Análise Gratuita

```typescript
const [hasUsedFreeAnalysis, setHasUsedFreeAnalysis] = useState(false);
const [freeAnalysisData, setFreeAnalysisData] = useState<PreviewData | null>(null);
```

### 2.2 Criar Função de Análise Gratuita

```typescript
async function startFreeAnalysis() {
  if (!file || !jobDescription.trim()) {
    setApiError("Por favor, envie seu CV e descreva a vaga.");
    return;
  }

  setStage("processing_free");
  setApiError("");
  setProgress(0);
  setStatusText("Analisando seu currículo...");

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);
    if (authUserId) {
      formData.append("user_id", authUserId);
    }

    const resp = await fetch(`${getApiUrl()}/api/analyze-free`, {
      method: "POST",
      body: formData,
    });

    const data = await resp.json();

    if (!resp.ok) {
      if (resp.status === 403) {
        // Usuário já usou análise gratuita
        setHasUsedFreeAnalysis(true);
        setStage("pricing");
        setApiError(data.error || "Você já usou sua análise gratuita.");
        return;
      }
      throw new Error(data.error || `HTTP ${resp.status}`);
    }

    setFreeAnalysisData(data);
    setHasUsedFreeAnalysis(true);
    setStage("free_preview");
  } catch (e: unknown) {
    setApiError(getErrorMessage(e, "Erro ao processar análise gratuita"));
    setStage("upload");
  }
}
```

### 2.3 Atualizar Renderização de Stages

```typescript
function renderStage() {
  switch (stage) {
    case "upload":
      return (
        <div className="upload-stage">
          {/* Conteúdo existente do upload */}
          <button 
            onClick={startFreeAnalysis}
            disabled={!file || !jobDescription.trim()}
          >
            Começar Análise Gratuita
          </button>
        </div>
      );

    case "processing_free":
      return (
        <div className="processing-stage">
          <div className="spinner"></div>
          <h2>Analisando seu currículo...</h2>
          <p>Identificando problemas e oportunidades de melhoria</p>
        </div>
      );

    case "free_preview":
      return (
        <FreeAnalysisStage
          previewData={freeAnalysisData}
          onUpgrade={() => setStage("pricing")}
        />
      );

    case "pricing":
      return (
        <PricingTiers
          onSelectTier={(tierId) => {
            setSelectedPlan(tierId);
            if (tierId === "free") {
              setStage("upload");
            } else {
              setStage("checkout");
            }
          }}
          currentTier={selectedPlan}
          showFree={!hasUsedFreeAnalysis}
        />
      );

    // ... outros stages existentes
  }
}
```

---

## 3. Implementar Post-Payment Account Creation

### 3.1 Atualizar Fluxo de Checkout

```typescript
async function startCheckout() {
  setCheckoutError("");

  const planId = selectedPlan || "premium";
  
  // Se não tiver email, pedir email (não precisa de senha ainda)
  if (!authEmail || !authEmail.includes("@")) {
    setCheckoutError("Digite um e-mail válido para continuar.");
    return;
  }

  try {
    const body = {
      plan_id: planId,
      customer_email: authEmail,
      score: freeAnalysisData?.nota_ats || 0,
    };

    const resp = await fetch(`${getApiUrl()}/api/stripe/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await resp.json();
    if (!resp.ok) {
      throw new Error(payload.error || `HTTP ${resp.status}`);
    }

    // Salvar dados antes de redirecionar
    if (typeof window !== "undefined" && jobDescription && file) {
      localStorage.setItem("vant_jobDescription", jobDescription);
      localStorage.setItem("vant_pending_plan", planId);
      
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem("vant_file_b64", reader.result as string);
        localStorage.setItem("vant_file_name", file.name);
        localStorage.setItem("vant_file_type", file.type);
        window.location.href = payload.url;
      };
      reader.readAsDataURL(file);
    }
  } catch (e: unknown) {
    setCheckoutError(getErrorMessage(e, "Erro ao iniciar checkout"));
  }
}
```

### 3.2 Criar Conta Após Pagamento

```typescript
useEffect(() => {
  // Após retorno do Stripe com pagamento confirmado
  if (payment === "success" && sessionId && !authUserId) {
    // Mostrar modal para criar conta
    setShowAccountCreationModal(true);
  }
}, [payment, sessionId, authUserId]);

async function createAccountAfterPayment(password: string) {
  if (!supabase || !authEmail) return;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: password,
    });

    if (error) throw error;

    if (data.user) {
      setAuthUserId(data.user.id);
      // Ativar entitlements
      await activateEntitlements(stripeSessionId, data.user.id);
      setStage("processing_premium");
    }
  } catch (e: unknown) {
    setCheckoutError(getErrorMessage(e, "Erro ao criar conta"));
  }
}
```

---

## 4. Adicionar Trust Signals

### 4.1 Badge de Garantia

```typescript
<div className="guarantee-badge">
  <span>🛡️</span>
  <span>Garantia de 7 dias ou seu dinheiro de volta</span>
</div>
```

### 4.2 Trust Footer

```typescript
<div className="trust-footer">
  <div className="trust-item">
    <span>🔒</span>
    <span>Pagamento seguro via Stripe</span>
  </div>
  <div className="trust-item">
    <span>⚡</span>
    <span>Cancele quando quiser</span>
  </div>
  <div className="trust-item">
    <span>💳</span>
    <span>Sem taxas de cancelamento</span>
  </div>
</div>
```

---

## 5. Configurar Variáveis de Ambiente

### 5.1 Backend (.env)

```bash
# Stripe Price IDs - Criar no Stripe Dashboard
STRIPE_PRICE_ID_PREMIUM=price_xxx    # R$ 27/mês
STRIPE_PRICE_ID_PRO=price_xxx        # R$ 47/mês
STRIPE_PRICE_ID_ULTIMATE=price_xxx   # R$ 97/mês

# Legacy (manter para usuários existentes)
STRIPE_PRICE_ID_BASIC=price_xxx
STRIPE_PRICE_ID_PREMIUM_PLUS=price_xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx

# Frontend URL
FRONTEND_CHECKOUT_RETURN_URL=http://localhost:3000/app
```

### 5.2 Frontend (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 6. Criar Produtos no Stripe

### Passo a Passo:

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Products** → **Add Product**
3. Crie os seguintes produtos:

#### Premium
- **Name:** Vant Premium
- **Price:** R$ 27,00
- **Billing:** Recurring (Monthly)
- **Copy Price ID:** `price_xxx`

#### Pro
- **Name:** Vant Pro
- **Price:** R$ 47,00
- **Billing:** Recurring (Monthly)
- **Copy Price ID:** `price_xxx`

#### Ultimate
- **Name:** Vant Ultimate
- **Price:** R$ 97,00
- **Billing:** Recurring (Monthly)
- **Copy Price ID:** `price_xxx`

4. Cole os Price IDs no arquivo `.env`

---

## 7. Executar SQL no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o conteúdo de `supabase_schema.sql`
4. Verifique se a tabela `free_usage` foi criada

---

## 8. Testar Localmente

### 8.1 Backend

```bash
cd backend
pip install -r requirements.txt
python start_server.py
```

### 8.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

### 8.3 Fluxo de Teste

1. ✅ Upload de CV + descrição de vaga
2. ✅ Análise gratuita processa
3. ✅ Mostra problemas (limitado a 2)
4. ✅ CTA para upgrade visível
5. ✅ Pricing page com 4 tiers
6. ✅ Seleção de plano
7. ✅ Checkout (email apenas)
8. ✅ Pagamento no Stripe
9. ✅ Retorno e criação de conta
10. ✅ Ativação de créditos
11. ✅ Processamento premium

---

## 9. Deploy

### 9.1 Backend (Render)

```bash
git add .
git commit -m "feat: implementar modelo freemium com 4 tiers"
git push origin main
```

Render detectará automaticamente e fará deploy.

### 9.2 Frontend (Vercel)

```bash
git push origin main
```

Vercel detectará automaticamente e fará deploy.

### 9.3 Variáveis de Ambiente

**Render (Backend):**
- Adicionar novos `STRIPE_PRICE_ID_*` no dashboard

**Vercel (Frontend):**
- Variáveis já configuradas, sem mudanças necessárias

---

## 10. Monitoramento

### Métricas a Acompanhar:

1. **Taxa de Ativação:** % de visitantes que fazem análise gratuita
2. **Taxa de Conversão:** % de usuários free que viram paid
3. **Distribuição de Tiers:** Quantos em cada plano
4. **Churn Rate:** Taxa de cancelamento por tier
5. **LTV:** Lifetime Value por tier

### Ferramentas:

- **Google Analytics:** Funil de conversão
- **Stripe Dashboard:** Métricas de receita
- **Supabase:** Queries customizadas

---

## 🎯 Resultado Esperado

Após implementação completa:

- ✅ Usuários podem testar gratuitamente
- ✅ Conversão baseada em valor percebido
- ✅ Menor friction no checkout
- ✅ 4 tiers claros e diferenciados
- ✅ Upsell natural
- ✅ Receita recorrente previsível

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do backend
2. Verificar console do navegador
3. Testar endpoints individualmente
4. Verificar variáveis de ambiente
5. Consultar documentação do Stripe/Supabase
