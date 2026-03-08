# 🧪 Guia Completo de Testes E2E - Vant

## 📋 Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Executando os Testes](#executando-os-testes)
3. [Estrutura de Testes](#estrutura-de-testes)
4. [Upload de Arquivos](#upload-de-arquivos)
5. [Comandos Customizados](#comandos-customizados)
6. [Boas Práticas](#boas-práticas)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Verificar Configuração do Cypress

O Cypress já está configurado em `cypress.config.ts` com:
- ✅ Base URL: `http://localhost:3000`
- ✅ Timeout padrão: 5000ms
- ✅ Screenshots automáticos em falhas
- ✅ Suporte a TypeScript

---

## ▶️ Executando os Testes

### Modo Interativo (Recomendado para Desenvolvimento)

```bash
npm run cypress:open
```

Isso abrirá a interface do Cypress onde você pode:
- Selecionar testes individuais
- Ver execução em tempo real
- Debugar facilmente
- Ver screenshots e vídeos

### Modo Headless (CI/CD)

```bash
npm run cypress:run
```

Executa todos os testes sem interface gráfica.

### Executar Teste Específico

```bash
npx cypress run --spec "cypress/e2e/upload-cv-completo.cy.ts"
```

### Executar com Browser Específico

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

---

## 📁 Estrutura de Testes

```
cypress/
├── e2e/
│   ├── upload-cv-completo.cy.ts    ← Teste completo de upload
│   ├── fluxo-principal.cy.ts       ← Fluxo principal da aplicação
│   ├── fluxos-automaticos.cy.ts    ← Testes automatizados
│   └── screenshots-ux.cy.ts        ← Testes de UX
├── fixtures/
│   ├── test-cv.txt                 ← CV de teste
│   ├── test-job-description.txt    ← Descrição de vaga de teste
│   └── example.json                ← Dados de exemplo
├── support/
│   ├── commands.ts                 ← Comandos customizados
│   └── e2e.ts                      ← Configurações globais
└── screenshots/                    ← Screenshots gerados
```

---

## 📤 Upload de Arquivos

### Método 1: Usando Comando Customizado

```typescript
cy.uploadFile('input[type="file"]', 'test-cv.txt')
```

### Método 2: Usando selectFile Diretamente

```typescript
cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', { force: true })
```

### Método 3: Upload com Drag & Drop

```typescript
cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', {
  action: 'drag-drop',
  force: true
})
```

### Criando Arquivos de Teste

#### PDF Simples (usando TXT como mock)
```typescript
// Criar arquivo em cypress/fixtures/
cy.writeFile('cypress/fixtures/test-cv.txt', 'Conteúdo do CV aqui...')
```

#### PDF Real (se necessário)
Para criar PDFs reais, você pode:
1. Adicionar PDFs manualmente em `cypress/fixtures/`
2. Usar biblioteca como `pdfkit` para gerar PDFs programaticamente

---

## 🛠️ Comandos Customizados

### Screenshot
```typescript
cy.takeScreenshot('nome-do-screenshot')
```

### Esperar e Clicar
```typescript
cy.waitForAndClick('[data-cy=botao]')
```

### Upload de Arquivo
```typescript
cy.uploadFile('input[type="file"]', 'arquivo.pdf')
```

### Verificar Texto
```typescript
cy.verifyText('h1', 'Título Esperado')
```

### Login Rápido
```typescript
cy.login('email@example.com', 'senha123')
```

### Esperar Carregamento
```typescript
cy.waitForLoading()
```

---

## ✅ Boas Práticas

### 1. Use Data Attributes para Seletores

**❌ Evite:**
```typescript
cy.get('.btn-primary').click()
cy.get('div > span:nth-child(2)').click()
```

**✅ Prefira:**
```typescript
cy.get('[data-cy=submit-button]').click()
cy.get('[data-testid=user-profile]').should('be.visible')
```

### 2. Aguarde Elementos Estarem Prontos

**❌ Evite:**
```typescript
cy.get('button').click()
```

**✅ Prefira:**
```typescript
cy.get('button').should('be.visible').and('not.be.disabled').click()
```

### 3. Use Aliases para Elementos Reutilizados

```typescript
cy.get('input[type="file"]').as('fileInput')
cy.get('@fileInput').selectFile('test.pdf')
```

### 4. Organize Testes com describe/it

```typescript
describe('Feature X', () => {
  beforeEach(() => {
    // Setup comum
  })

  it('deve fazer Y', () => {
    // Teste específico
  })

  it('deve fazer Z', () => {
    // Outro teste
  })
})
```

### 5. Tire Screenshots em Pontos Importantes

```typescript
cy.takeScreenshot('01-estado-inicial')
// ... ações ...
cy.takeScreenshot('02-apos-acao')
```

---

## 🔧 Troubleshooting

### Problema: "Element is not visible"

**Solução:**
```typescript
cy.get('input[type="file"]').selectFile('test.pdf', { force: true })
```

### Problema: "Timed out waiting for element"

**Solução:** Aumentar timeout específico
```typescript
cy.get('button', { timeout: 10000 }).click()
```

### Problema: Upload não funciona

**Verificar:**
1. Arquivo existe em `cypress/fixtures/`
2. Caminho está correto
3. Input file está presente no DOM
4. Usar `{ force: true }` se necessário

### Problema: Teste falha aleatoriamente

**Soluções:**
1. Adicionar `cy.wait()` estratégicos
2. Usar `should()` para garantir estado
3. Verificar race conditions
4. Aumentar timeouts se necessário

### Problema: Screenshots não aparecem

**Verificar:**
- Pasta `cypress/screenshots/` existe
- Permissões de escrita
- Configuração em `cypress.config.ts`

---

## 📊 Exemplo Completo de Teste

```typescript
describe('Upload de CV - Fluxo Completo', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(1000)
  })

  it('deve completar análise com sucesso', () => {
    // 1. Verificar página inicial
    cy.contains('Vença o algoritmo ATS').should('be.visible')
    cy.takeScreenshot('01-inicial')

    // 2. Preencher descrição da vaga
    cy.get('textarea[placeholder*="Cole a descrição"]')
      .type('Desenvolvedor Full Stack Sênior')
    cy.takeScreenshot('02-vaga-preenchida')

    // 3. Upload do CV
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/test-cv.txt', { force: true })
    cy.wait(500)
    cy.takeScreenshot('03-cv-carregado')

    // 4. Iniciar análise
    cy.contains('button', 'ANALISAR CV GRÁTIS')
      .should('not.be.disabled')
      .click()
    cy.takeScreenshot('04-analise-iniciada')

    // 5. Aguardar resultado
    cy.wait(2000)
    cy.takeScreenshot('05-resultado')
  })
})
```

---

## 🎯 Testes Disponíveis

### `upload-cv-completo.cy.ts`
- ✅ Fluxo completo de upload e análise
- ✅ Modo "Com vaga" e "Sem vaga"
- ✅ Validação de campos obrigatórios
- ✅ Configurações avançadas
- ✅ Responsividade mobile
- ✅ Limite de caracteres
- ✅ Alternância entre modos

### Como Executar

```bash
# Abrir interface do Cypress
npm run cypress:open

# Executar apenas teste de upload
npx cypress run --spec "cypress/e2e/upload-cv-completo.cy.ts"

# Executar todos os testes
npm run cypress:run
```

---

## 📝 Adicionando Novos Testes

### 1. Criar arquivo de teste

```bash
# Criar novo arquivo em cypress/e2e/
touch cypress/e2e/meu-novo-teste.cy.ts
```

### 2. Estrutura básica

```typescript
describe('Minha Feature', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('deve fazer algo específico', () => {
    // Seu teste aqui
  })
})
```

### 3. Adicionar fixtures se necessário

```bash
# Adicionar arquivos de teste em cypress/fixtures/
```

---

## 🚀 Próximos Passos

1. **Integração com CI/CD**
   - Configurar GitHub Actions
   - Executar testes automaticamente em PRs

2. **Testes de API**
   - Testar endpoints do backend
   - Validar respostas

3. **Testes de Performance**
   - Lighthouse CI
   - Métricas de carregamento

4. **Testes de Acessibilidade**
   - cypress-axe para validação WCAG

---

## 📚 Recursos Úteis

- [Documentação Oficial Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
- [Cypress Recipes](https://github.com/cypress-io/cypress-example-recipes)

---

## 🆘 Suporte

Se encontrar problemas:
1. Verificar logs do Cypress
2. Consultar este guia
3. Verificar documentação oficial
4. Abrir issue no repositório

**Última atualização:** Março 2026
