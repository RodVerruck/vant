# Guia de Data-CY Attributes para Cypress

## 🎯 O que são Data-CY Attributes?

São atributos HTML especiais usados pelo Cypress para selecionar elementos de forma robusta e independente de CSS classes ou estrutura DOM.

## 📝 Atributos Necessários para os Testes

### 1. Página Inicial
```html
<!-- Título principal -->
<h1 data-cy="main-heading">Vant</h1>

<!-- Botão principal de CTA -->
<button data-cy="main-cta">COMEÇAR AGORA</button>

<!-- Botão de login -->
<button data-cy="login-button">ENTRAR</button>

<!-- Botão para ver planos -->
<button data-cy="see-plans-button">VER PLANOS</button>

<!-- Área de upload de CV -->
<div data-cy="cv-upload">
  <input type="file" data-cy="cv-file-input" />
</div>
```

### 2. Modal de Autenticação
```html
<!-- Modal container -->
<div data-cy="auth-modal">
  <!-- Título do modal -->
  <h2 data-cy="auth-title">Criar conta para continuar</h2>
  
  <!-- Formulário -->
  <form data-cy="auth-form">
    <!-- Email input -->
    <input type="email" data-cy="email-input" />
    
    <!-- Password inputs -->
    <input type="password" data-cy="password-input" />
    <input type="password" data-cy="password-confirm" />
    
    <!-- Botão de submit -->
    <button type="submit" data-cy="login-submit">CRIAR CONTA GRÁTIS</button>
  </form>
</div>
```

### 3. Página de Planos
```html
<!-- Container de planos -->
<div data-cy="pricing-container">
  <!-- Cards de planos -->
  <div data-cy="plan-basic">Plano Básico</div>
  <div data-cy="plan-premium">Plano Premium</div>
</div>
```

### 4. Estados da Aplicação
```html
<!-- Loading states -->
<div data-cy="loading">Carregando...</div>

<!-- Error states -->
<div data-cy="error-message">Erro ao carregar</div>

<!-- Success states -->
<div data-cy="success-message">Sucesso!</div>
```

### 5. Dashboard/Área do Usuário
```html
<!-- Container principal -->
<div data-cy="dashboard">
  <!-- Menu de navegação -->
  <nav data-cy="main-nav">
    <a data-cy="nav-home">Início</a>
    <a data-cy="nav-profile">Perfil</a>
    <a data-cy="nav-history">Histórico</a>
  </nav>
  
  <!-- Conteúdo principal -->
  <main data-cy="main-content">
    <!-- Cards de informações -->
    <div data-cy="credits-card">29 créditos</div>
    <div data-cy="usage-card">Últimos usos</div>
  </main>
</div>
```

## 🔧 Como Implementar

### 1. Adicionar aos Componentes React
```tsx
// Exemplo no page.tsx
<button 
  data-cy="login-button"
  onClick={handleLogin}
>
  ENTRAR
</button>

// Exemplo no AuthModal.tsx
<h2 data-cy="auth-title">
  {isLoginMode ? "Bem-vindo de volta" : "Criar conta para continuar"}
</h2>
```

### 2. Verificar no DevTools
```bash
# Abrir DevTools (F12)
# Console: document.querySelector('[data-cy="login-button"]')
```

## 📋 Checklist de Implementação

### ✅ Página Inicial
- [ ] `data-cy="main-heading"` no título principal
- [ ] `data-cy="main-cta"` no botão principal
- [ ] `data-cy="login-button"` no botão de login
- [ ] `data-cy="see-plans-button"` no botão de planos
- [ ] `data-cy="cv-upload"` na área de upload
- [ ] `data-cy="cv-file-input"` no input de arquivo

### ✅ Modal de Autenticação
- [ ] `data-cy="auth-modal"` no container do modal
- [ ] `data-cy="auth-title"` no título
- [ ] `data-cy="email-input"` no campo de email
- [ ] `data-cy="password-input"` no campo de senha
- [ ] `data-cy="password-confirm"` no campo de confirmação
- [ ] `data-cy="login-submit"` no botão de submit

### ✅ Estados Globais
- [ ] `data-cy="loading"` em indicadores de loading
- [ ] `data-cy="error-message"` em mensagens de erro
- [ ] `data-cy="success-message"` em mensagens de sucesso

## 🎨 Benefícios

### 1. **Testes Robustos**
- Não quebram com mudanças CSS
- Independentes de estrutura DOM
- Fáceis de manter

### 2. **Colaboração**
- UX Team pode identificar elementos facilmente
- Desenvolvedores sabem exatamente o que testar
- Documentação viva da aplicação

### 3. **Performance**
- Seletores mais rápidos que CSS classes
- Menos falsos positivos
- Debug mais fácil

## 🚀 Implementação Rápida

### Passo 1: Adicionar atributos principais
```bash
# Focar nos elementos mais críticos primeiro
- Botões principais
- Formulários
- Navegação
```

### Passo 2: Testar com Cypress
```bash
# Verificar se elementos são encontrados
npm run cypress:open
# Selecionar "screenshots-ux.cy.ts"
```

### Passo 3: Refinar
```bash
# Adicionar atributos faltantes conforme necessidade
# Baseado nos erros dos testes
```

## 📊 Exemplo de Teste Funcional

```typescript
// Depois de adicionar data-cy attributes
it('Deve fazer login com sucesso', () => {
  cy.visit('/')
  cy.waitForAndClick('[data-cy="login-button"]')
  cy.get('[data-cy="email-input"]').type('test@example.com')
  cy.get('[data-cy="password-input"]').type('test123456')
  cy.waitForAndClick('[data-cy="login-submit"]')
  cy.takeScreenshot('login-sucesso')
})
```

## 🔄 Manutenção

### Quando mudar?
- Novos componentes: Adicionar data-cy
- Mudanças de UI: Verificar se data-cy ainda faz sentido
- Refatoração: Manter data-cy consistentes

### Boas práticas
- Usar kebab-case: `data-cy="login-button"`
- Ser descritivo: `data-cy="user-profile-form"`
- Manter consistência: `data-cy="submit-button"` vs `data-cy="submit-btn"`

---

## 🎯 Próximos Passos

1. **Implementar data-cy attributes** nos componentes principais
2. **Executar testes** para validar
3. **Refinar** conforme necessário
4. **Documentar** novos atributos adicionados
