# Estratégia Freemium - Vant

## 🎯 Objetivo
Aumentar conversão removendo paywall inicial e implementando modelo freemium com 4 tiers.

## 📊 Estrutura de Tiers

### 🆓 Gratuito (Free)
**Preço:** R$ 0  
**Objetivo:** Aquisição e demonstração de valor

**Recursos:**
- 1 análise gratuita (sem necessidade de cartão)
- Diagnóstico básico do CV
- 2 sugestões de melhoria
- Score ATS
- Identificação de problemas principais

**Limitações:**
- Apenas 1 análise por usuário (rastreado por user_id)
- Não permite download do CV otimizado
- Não mostra todas as sugestões

**Call-to-Action:** "Começar Grátis"

---

### 💎 Premium
**Preço:** R$ 27/mês  
**Objetivo:** Conversão principal (10-15% dos usuários gratuitos)

**Recursos:**
- ✅ Análises ilimitadas
- ✅ Otimizações completas
- ✅ CV otimizado para download (PDF + Word)
- ✅ Biblioteca de conteúdos
- ✅ Suporte prioritário

**Ideal para:** Profissionais buscando oportunidades ativamente

**Call-to-Action:** "Assinar Premium"

---

### 🚀 Pro
**Preço:** R$ 47/mês  
**Objetivo:** Upsell para usuários avançados

**Recursos:**
- ✅ Tudo do Premium
- ✅ Simulador de entrevista com IA
- ✅ Radar de vagas compatíveis
- ✅ Análise de concorrência
- ✅ Relatórios avançados

**Ideal para:** Profissionais que querem se destacar

**Call-to-Action:** "Assinar Pro"

---

### ⭐ Ultimate
**Preço:** R$ 97/mês  
**Objetivo:** Consultoria premium (alto valor)

**Recursos:**
- ✅ Tudo do Pro
- ✅ Revisão humana por especialista
- ✅ Otimização de perfil LinkedIn
- ✅ Consultoria de carreira 1:1
- ✅ Acesso vitalício a atualizações

**Ideal para:** Executivos e profissionais de alto nível

**Call-to-Action:** "Assinar Ultimate"

---

## 🔄 Novo Fluxo de Conversão

### ANTES (Atual)
```
Upload CV → Paywall → Pagamento → Criar Conta → Produto
```
**Problemas:**
- ❌ Usuário não vê valor antes de pagar
- ❌ Friction desnecessário (criar conta antes de pagar)
- ❌ Alta taxa de abandono

### DEPOIS (Freemium)
```
Upload CV → Análise Gratuita → Ver Valor → Upgrade Natural → Pagamento → Produto
```
**Benefícios:**
- ✅ Usuário vê valor imediatamente
- ✅ Decisão de compra informada
- ✅ Menor friction (paga primeiro, cria conta depois)
- ✅ Conversão natural baseada em valor percebido

---

## 🎨 Melhorias de UX Implementadas

### 1. Análise Gratuita Sem Paywall
- Primeiro CV é processado gratuitamente
- Mostra problemas reais do CV
- Exibe 2 sugestões de melhoria
- Score ATS visível
- CTA claro para upgrade

### 2. Pricing Page Redesenhada
- 4 tiers claramente diferenciados
- Badge "MAIS POPULAR" no Premium
- Features listadas com checkmarks
- Garantia de 7 dias visível
- Trust signals (pagamento seguro, cancele quando quiser)

### 3. Post-Payment Account Creation
- Usuário paga primeiro
- Cria conta depois para acessar o produto
- Reduz friction no momento da decisão
- Email já capturado no checkout

### 4. Garantia Visível
- "Garantia de 7 dias ou seu dinheiro de volta"
- Badge destacado na pricing page
- Reduz risco percebido
- Aumenta confiança

---

## 🛠️ Implementação Técnica

### Backend (`backend/main.py`)

#### Novos Endpoints:
```python
POST /api/analyze-free
- Análise gratuita (primeira análise)
- Verifica uso prévio via free_usage table
- Retorna diagnóstico limitado
```

#### Pricing Atualizado:
```python
PRICING = {
    "free": {...},      # Novo
    "premium": {...},   # Novo (R$ 27/mês)
    "pro": {...},       # Atualizado (R$ 47/mês)
    "ultimate": {...},  # Novo (R$ 97/mês)
    "basico": {...},    # Legacy
    "premium_plus": {...} # Legacy
}
```

### Database (`supabase_schema.sql`)

#### Nova Tabela:
```sql
CREATE TABLE free_usage (
    user_id TEXT PRIMARY KEY,
    used_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend

#### Novo Componente:
- `PricingTiers.tsx` - Componente de pricing com 4 tiers

#### Atualizações Necessárias:
- `page.tsx` - Integrar análise gratuita
- Adicionar stage "free_preview" para análise gratuita
- Mostrar pricing após análise gratuita
- Permitir upgrade a qualquer momento

---

## 📈 Métricas de Sucesso

### Conversão Esperada:
- **Free → Premium:** 10-15%
- **Premium → Pro:** 5-8%
- **Pro → Ultimate:** 2-3%

### KPIs a Monitorar:
1. Taxa de ativação (% que faz análise gratuita)
2. Taxa de conversão Free → Paid
3. Tempo até primeira conversão
4. Churn rate por tier
5. LTV (Lifetime Value) por tier

---

## 🚀 Próximos Passos

### Fase 1: MVP Freemium (Atual)
- [x] Atualizar backend com novos tiers
- [x] Criar endpoint de análise gratuita
- [x] Adicionar tabela free_usage
- [x] Criar componente PricingTiers
- [ ] Integrar análise gratuita no frontend
- [ ] Atualizar fluxo de onboarding
- [ ] Testar localmente

### Fase 2: Features Pro/Ultimate
- [ ] Implementar simulador de entrevista (Pro)
- [ ] Criar radar de vagas (Pro)
- [ ] Adicionar análise de concorrência (Pro)
- [ ] Sistema de revisão humana (Ultimate)
- [ ] Otimização LinkedIn (Ultimate)

### Fase 3: Otimização
- [ ] A/B testing de pricing
- [ ] Otimizar copy dos CTAs
- [ ] Adicionar social proof
- [ ] Implementar email nurturing
- [ ] Analytics e tracking

---

## 💡 Dicas de Conversão

### 1. Mostre Valor Imediatamente
- Análise gratuita deve impressionar
- Destaque problemas críticos
- Mostre o "antes e depois" potencial

### 2. Urgência Sutil
- "Vagas sendo preenchidas agora"
- "Outros candidatos já otimizaram"
- Sem pressão agressiva

### 3. Social Proof
- "50K+ CVs otimizados"
- Depoimentos reais
- Casos de sucesso

### 4. Redução de Risco
- Garantia de 7 dias
- Cancele quando quiser
- Sem taxas escondidas

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente (.env)
```bash
# Novos Stripe Price IDs
STRIPE_PRICE_ID_PREMIUM=price_xxx  # R$ 27/mês
STRIPE_PRICE_ID_PRO=price_xxx      # R$ 47/mês (atualizar)
STRIPE_PRICE_ID_ULTIMATE=price_xxx # R$ 97/mês

# Manter legacy
STRIPE_PRICE_ID_BASIC=price_xxx
STRIPE_PRICE_ID_PREMIUM_PLUS=price_xxx
```

### Stripe Dashboard
1. Criar novos produtos:
   - Premium (R$ 27/mês recorrente)
   - Pro (R$ 47/mês recorrente)
   - Ultimate (R$ 97/mês recorrente)

2. Copiar Price IDs para .env

3. Configurar webhooks (se necessário)

### Supabase
1. Executar SQL do `supabase_schema.sql`
2. Criar tabela `free_usage`
3. Verificar índices

---

## 📝 Notas Importantes

- **Planos Legacy:** Manter `basico` e `premium_plus` para usuários existentes
- **Migração:** Não forçar migração de usuários atuais
- **Comunicação:** Avisar usuários sobre novos planos
- **Grandfathering:** Considerar manter preço antigo para clientes atuais

---

## 🎯 Resultado Esperado

Com esta estratégia freemium:
- ✅ Mais usuários experimentam o produto
- ✅ Conversão baseada em valor percebido
- ✅ Menor friction no funil
- ✅ Upsell natural para tiers superiores
- ✅ Receita recorrente previsível
- ✅ LTV maior por cliente
