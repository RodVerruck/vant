# Guia de Debugging - Fluxo de Compra Pós-Login

## 🔍 Problema: Usuário ainda vai para o dashboard

### Passos para Debugging

#### 1. Abrir Console do Navegador
- F12 → Console
- Limpar console (Clear)

#### 2. Limpar Tudo
```javascript
localStorage.clear();
location.reload();
```

#### 3. Testar Fluxo Trial
1. Clicar em "COMEÇAR TRIAL R$ 1,99"
2. **VERIFICAR LOG**: `[PricingSimplified] Intenção de compra capturada`
3. Fazer login (Google ou email)
4. **VERIFICAR LOGS**:
   ```
   [AuthModal onSuccess] Callback executado. userId: xxx email: xxx
   [Auth useEffect] Entrou. authUserId: xxx
   [Auth useEffect] Verificando localStorage: {checkout_pending: true}
   [Auth useEffect] hasActiveFlow: true {hasCheckoutPending: true}
   [Auth] Fluxo ativo detectado, mantendo em /app
   [Auth] Processando checkout_pending: {plan: "trial", ...}
   ```

#### 4. Se for para dashboard, verificar qual log aparece:
```
[Auth] Usuário autenticado sem fluxo ativo, redirecionando para /dashboard
```

### 🚨 Possíveis Causas

#### Causa 1: useEffect não está executando
- **Sintoma**: Não aparece `[Auth useEffect] Entrou`
- **Verificação**: `authUserId` está null quando useEffect roda

#### Causa 2: checkout_pending não encontrado
- **Sintoma**: `checkout_pending: false` nos logs
- **Verificação**: localStorage foi limpo antes do useEffect

#### Causa 3: Race condition
- **Sintoma**: Logs aparecem mas mesmo assim redireciona
- **Verificação**: Ordem de execução dos useEffects

### 🛠️ Soluções

#### Solução 1: Verificar se PricingSimplified está sendo usado
```javascript
// No console, clicar no botão e verificar:
localStorage.getItem('checkout_pending')
```

#### Solução 2: Adicionar mais logs
```javascript
// No início do useEffect principal
console.log("[Auth useEffect] DEBUG - authUserId:", authUserId);
console.log("[Auth useEffect] DEBUG - typeof window:", typeof window);
console.log("[Auth useEffect] DEBUG - checkout_pending:", localStorage.getItem('checkout_pending'));
```

#### Solução 3: Verificar se é NeonOffer
Se o botão for do NeonOffer, verificar se `onCheckout` está sendo chamado.

### 📋 Checklist de Verificação

- [ ] Botão de compra captura `checkout_pending`
- [ ] Login executa callback `onSuccess`
- [ ] useEffect principal detecta `authUserId`
- [ ] useEffect encontra `checkout_pending`
- [ ] `hasActiveFlow` é `true`
- [ ] Não redireciona para dashboard

### 🎯 Teste Final

Se tudo funcionar, você deve ver:
1. Login bem-sucedido
2. Permanecer em `/app`
3. Stage mudar para `checkout`
4. Tela de pagamento aparecer

### 📞 Se ainda não funcionar

1. **Tire um print** dos logs do console
2. **Verifique** qual componente está sendo usado (PricingSimplified vs NeonOffer)
3. **Teste** com incognito mode (para排除 cache issues)

## 🔧 Comandos Úteis

```javascript
// Verificar estado atual
console.log("authUserId:", window.authUserId); // se disponível
console.log("stage:", window.stage); // se disponível
console.log("checkout_pending:", localStorage.getItem('checkout_pending'));

// Forçar teste manual
localStorage.setItem('checkout_pending', JSON.stringify({
    plan: "trial",
    amount: 1.99,
    timestamp: Date.now(),
    source: 'manual_test'
}));
location.reload();
```
