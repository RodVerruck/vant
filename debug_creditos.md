# 🔍 Debugging - Créditos Não Aparecem

## 📋 Como Debuggar Passo a Passo

### 1. **Limpar Tudo e Testar**
```javascript
localStorage.clear();
location.reload();
```

### 2. **Fazer Compra de Crédito Avulso**
- Clique em "COMPRAR CRÉDITO" (R$ 12,90)
- Faça login
- Pague no Stripe
- Volte para o app

### 3. **Observar Logs no Console**

#### ✅ Logs Esperados (Sucesso):
```
[Auth] Processando checkout_pending: {plan: "credit_1", ...}
[Auth] Sincronizando créditos em background...
[Auth] user/status response: {credits_remaining: 1, ...}
[Auth] Créditos sincronizados em background (user/status): 1
```

#### ⚠️ Logs de Problema:
```
[Auth] user/status response: {credits_remaining: 0, ...}
[Auth] user/status falhou ou sem créditos, tentando syncEntitlements...
[syncEntitlements] Créditos atualizados e cacheados: 1
```

#### ❌ Logs de Falha:
```
[Auth] Erro ao sincronizar créditos: [ERRO]
[syncEntitlements] Créditos atualizados e cacheados: 0
```

### 4. **Verificar Estado Atual**
```javascript
// No console, verificar:
console.log("creditsRemaining:", window.creditsRemaining); // se disponível
console.log("localStorage credits:", localStorage.getItem('vant_cached_credits'));
console.log("stage atual:", window.stage); // se disponível
```

## 🚨 Possíveis Causas e Soluções

### Causa 1: Backend não atualizou créditos
- **Sintoma**: Todas as APIs retornam 0 créditos
- **Verificação**: Logs mostram `credits_remaining: 0`
- **Ação**: Verificar backend Stripe webhook

### Causa 2: Race condition
- **Sintoma**: Logs mostram créditos mas UI não atualiza
- **Verificação**: `creditsRemaining` no state vs localStorage
- **Ação**: Forçar refresh manual

### Causa 3: Cache desatualizado
- **Sintoma**: localStorage tem valor antigo
- **Verificação**: `localStorage.getItem('vant_cached_credits')`
- **Ação**: Limpar cache

## 🛠️ Testes Manuais

### Teste 1: Forçar Sincronização
```javascript
// No console do navegador (se estiver logado):
const authUserId = "SEU_USER_ID";
fetch(`${window.location.origin}/api/entitlements/status`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({user_id: authUserId})
}).then(r => r.json()).then(data => {
    console.log("Resposta direta:", data);
});
```

### Teste 2: Verificar Status do Usuário
```javascript
// No console:
fetch(`${window.location.origin}/api/user/status/SEU_USER_ID`)
    .then(r => r.json())
    .then(data => console.log("Status usuário:", data));
```

### Teste 3: Limpar e Resetar
```javascript
// Reset completo:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 📊 Logs Detalhados para Observar

### Durante o Pagamento:
1. `[Auth] Processando checkout_pending`
2. `[Auth] Sincronizando créditos pós-checkout...`

### Após Retorno do Stripe:
1. `[PaymentSync] Pagamento detectado, sincronizando créditos agressivamente...`
2. `[PaymentSync] Primeira sincronização concluída`

### No Login/Carregamento:
1. `[Auth] Sincronizando créditos em background...`
2. `[syncEntitlements] Créditos atualizados e cacheados: X`

## 🎯 Se Nada Funcionar

1. **Verificar webhook do Stripe** no backend
2. **Verificar se pagamento foi confirmado** no banco
3. **Testar com usuário diferente** para isolar problema
4. **Verificar se há erro de permissão** nas APIs

## 📞 Informações para Coletar

Se o problema persistir, cole aqui:
1. **Todos os logs do console** durante o fluxo completo
2. **Resposta das APIs** (Teste 1 e 2)
3. **ID do usuário** e **ID da sessão Stripe**
4. **URL completa** após retorno do pagamento

---

**Execute estes passos e me diga quais logs aparecem!** 🚀
