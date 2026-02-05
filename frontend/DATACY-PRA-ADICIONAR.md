# 🎯 Data-CY Attributes - Copiar e Colar

## 📋 Adicionar estes atributos nos componentes:

### 1. Em `page.tsx` - Página Principal

```tsx
// Título principal
<h1 data-cy="main-heading">Vant</h1>

// Botões principais
<button data-cy="main-cta">COMEÇAR AGORA</button>
<button data-cy="login-button">ENTRAR</button>
<button data-cy="see-plans-button">VER PLANOS</button>

// Área de upload
<div data-cy="cv-upload-area">
  <input type="file" data-cy="cv-file-input" />
</div>

// Container principal
<div data-cy="main-container">
```

### 2. Em `AuthModal.tsx` - Modal de Login

```tsx
// Modal
<div data-cy="auth-modal">

// Título
<h2 data-cy="auth-title">Criar conta para continuar</h2>

// Formulário
<form data-cy="auth-form">

// Inputs
<input type="email" data-cy="email-input" />
<input type="password" data-cy="password-input" />
<input type="password" data-cy="password-confirm" />

// Botões
<button type="submit" data-cy="login-submit">CRIAR CONTA GRÁTIS</button>
<button type="button" data-cy="login-cancel">Cancelar</button>

// Links
<a data-cy="forgot-password">Esqueceu a senha?</a>
<a data-cy="signup-link">Criar conta</a>

</form>
</div>
```

### 3. Em `PricingSimplified.tsx` - Planos

```tsx
// Container
<div data-cy="pricing-container">

// Cards de planos
<div data-cy="plan-basic">Plano Básico</div>
<div data-cy="plan-premium">Plano Premium</div>
<div data-cy="plan-pro">Plano Pro</div>

// Botões de plano
<button data-cy="select-plan-basic">Escolher Básico</button>
<button data-cy="select-plan-premium">Escolher Premium</button>
<button data-cy="select-plan-pro">Escolher Pro</button>

// Preços
<span data-cy="price-basic">R$ 19,90</span>
<span data-cy="price-premium">R$ 39,90</span>
<span data-cy="price-pro">R$ 79,90</span>

</div>
```

### 4. Em componentes genéricos

```tsx
// Loading
<div data-cy="loading">Carregando...</div>

// Error
<div data-cy="error-message">Erro ao carregar</div>

// Success
<div data-cy="success-message">Sucesso!</div>

// Menu
<nav data-cy="main-nav">
  <a data-cy="nav-home">Início</a>
  <a data-cy="nav-profile">Perfil</a>
  <a data-cy="nav-history">Histórico</a>
</nav>

// Cards
<div data-cy="credits-card">29 créditos</div>
<div data-cy="usage-card">Últimos usos</div>
```

## 🔧 Como Adicionar Rapidamente:

### Método 1: Find and Replace
1. Abra o componente
2. Ctrl+F para encontrar o elemento
3. Adicione `data-cy="nome"` ao elemento

### Exemplo:
```tsx
// ANTES:
<button>ENTRAR</button>

// DEPOIS:
<button data-cy="login-button">ENTRAR</button>
```

## ✅ Checklist de Implementação:

- [ ] `page.tsx`: Adicionar data-cy nos elementos principais
- [ ] `AuthModal.tsx`: Adicionar data-cy no modal e formulário
- [ ] `PricingSimplified.tsx`: Adicionar data-cy nos planos
- [ ] Outros componentes: Adicionar data-cy conforme necessário

## 🚀 Depois de Adicionar:

1. Execute: `scripts\testar-tudo.bat`
2. Veja os prints em `cypress\screenshots\`
3. Envie para UX Team com as explicações do console

## 📝 Dica:

Adicione apenas os data-cy mais importantes primeiro:
- Botões principais
- Campos de formulário  
- Títulos
- Containers principais

Depois pode adicionar os outros conforme necessidade.
