# Teste do Fluxo de Compra Pós-Login

## Como Testar

### 1. Limpar localStorage
```javascript
// No console do navegador
localStorage.clear();
```

### 2. Testar Fluxo Trial
1. Abrir http://localhost:3000/app
2. Clicar em "COMEÇAR TRIAL R$ 1,99"
3. Verificar no console: `[PricingSimplified] Intenção de compra capturada`
4. Fazer login com Google ou email
5. Verificar no console: `[Page.tsx] Intenção de compra detectada pós-login`
6. **Resultado**: Deve ir para checkout (não dashboard)

### 3. Testar Fluxo com Arquivo
1. Fazer upload de um PDF
2. Clicar em "COMPRAR CRÉDITO" 
3. Verificar no console: Intenção com metadados do arquivo
4. Fazer login
5. **Resultado**: Checkout com contexto do arquivo

### 4. Testar Fluxo Normal (Sem Intenção)
1. Fazer login diretamente (sem clicar em comprar)
2. **Resultado**: Deve ir para hero/dashboard normalmente

### 5. Testar Timeout
1. Iniciar uma compra mas não finalizar
2. Esperar 30 minutos
3. Tentar fazer login
4. **Resultado**: Intenção expirada, fluxo normal

## Logs Esperados

### Sucesso
```
[PricingSimplified] Intenção de compra capturada: {plan: "trial", amount: 1.99, timestamp: 1739041234567, source: 'pricing_page'}
[Auth] Fluxo ativo detectado, mantendo em /app
[Auth] Processando checkout_pending: {plan: "trial", amount: 1.99, timestamp: 1739041234567, source: 'pricing_page'}
```

### Debug Adicional
```
[AuthModal] Intenção de compra capturada no Google auth: {plan: "trial", timestamp: 1739041234567, source: 'auth_modal_google'}
[Page.tsx] Intenção de compra detectada pós-login: {plan: "trial", amount: 1.99, timestamp: 1739041234567, source: 'pricing_page'}
```

### Timeout
```
[Page.tsx] Limpando intenção de compra expirada: {plan: "trial", timestamp: 1739041234567}
[Auth] Usuário autenticado sem fluxo ativo, redirecionando para /dashboard
```

### Fluxo Normal (Sem Intenção)
```
[Auth] Usuário autenticado sem fluxo ativo, redirecionando para /dashboard
```

## Verificação no localStorage

### Durante o fluxo
```javascript
// Deve conter:
localStorage.getItem('checkout_pending')
// '{"plan":"trial","amount":1.99,"timestamp":1739041234567,"source":"pricing_page"}'
```

### Pós-login
```javascript
// Deve estar limpo:
localStorage.getItem('checkout_pending') // null
```

## Componentes Modificados

✅ **PricingSimplified.tsx** - Captura intenção nos botões
✅ **AuthModal.tsx** - Captura intenção no login  
✅ **page.tsx** - Verificação pós-login e timeout
✅ **Build** - TypeScript compilado sem erros

## Status: ✅ PRONTO PARA TESTES
