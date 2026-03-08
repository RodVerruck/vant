# Cypress Testing - Vant

## 🚀 Configuração Rápida

### Pré-requisitos
- Node.js instalado
- Servidor Next.js rodando em `http://localhost:3000`

### Instalação
```bash
npm install --save-dev cypress
```

## 📸 Comandos para Testes

### 1. Interface Visual (Recomendado para UX)
```bash
npm run cypress:open
# ou
npm run test:e2e:ui
```

### 2. Execução Rápida (Terminal)
```bash
# Todos os testes
npm run cypress:run

# Apenas teste de upload completo (RECOMENDADO)
npm run test:e2e -- --spec "cypress/e2e/upload-cv-completo.cy.ts"

# Apenas screenshots para UX
npm run test:e2e -- --spec "cypress/e2e/screenshots-ux.cy.ts"

# Apenas fluxo principal
npm run test:e2e -- --spec "cypress/e2e/fluxo-principal.cy.ts"
```

### 3. Scripts Personalizados (Windows)
```cmd
# Interface visual
scripts\run-tests.bat ui

# Apenas screenshots
scripts\run-tests.bat screenshots

# Apenas fluxo principal
scripts\run-tests.bat fluxo

# Testes rápidos (sem vídeos)
scripts\run-tests.bat rapido
```

## 📁 Estrutura de Arquivos

```
cypress/
├── e2e/
│   ├── fluxo-principal.cy.ts    # Testes do fluxo principal
│   └── screenshots-ux.cy.ts    # Screenshots para UX Team
├── support/
│   ├── commands.ts             # Comandos personalizados
│   └── e2e.ts                  # Configurações globais
├── fixtures/
│   └── example.json            # Dados de teste
├── screenshots/                # 📸 Screenshots gerados
└── videos/                     # 📹 Vídeos dos testes
```

## 🎯 Testes Disponíveis

### 1. Upload CV Completo (`upload-cv-completo.cy.ts`) ⭐ NOVO
- ✅ Fluxo completo de upload e análise
- ✅ Modo "Tenho uma vaga" com descrição
- ✅ Modo "Não tenho vaga" com seleção de área
- ✅ Validação de campos obrigatórios
- ✅ Configurações avançadas (comparativo)
- ✅ Responsividade mobile (375x667)
- ✅ Limite de caracteres (5000)
- ✅ Alternância entre modos

### 2. Fluxo Principal (`fluxo-principal.cy.ts`)
- ✅ Carregamento da página inicial
- ✅ Abertura de modal de autenticação
- ✅ Preenchimento de formulários
- ✅ Upload de CV
- ✅ Navegação para planos
- ✅ Responsividade
- ✅ Acessibilidade básica

### 3. Screenshots UX (`screenshots-ux.cy.ts`)
- 📸 Múltiplas resoluções (Desktop, Tablet, Mobile)
- 📸 Estados da aplicação (Loading, Error, Success)
- 📸 Fluxo completo do usuário
- 📸 Hover em elementos interativos

## 📱 Resoluções Testadas

- **Desktop**: 1920x1080, 1440x900, 1366x768, 1280x720
- **Tablet**: 1024x768, 768x1024
- **Mobile**: 375x667, 360x640

## 🔧 Comandos Personalizados

### Para Screenshots
```typescript
cy.takeScreenshot('nome-da-imagem')
```

### Para Interações
```typescript
cy.waitForAndClick('[data-cy=selector]')
cy.verifyText('[data-cy=selector]', 'texto esperado')
cy.uploadFile('[data-cy=file-input]', 'arquivo.pdf')
```

## 📊 Resultados

### Screenshots
- **Localização**: `cypress/screenshots/`
- **Formato**: PNG
- **Qualidade**: Alta
- **Nomenclatura**: Automática por teste

### Vídeos
- **Localização**: `cypress/videos/`
- **Formato**: MP4
- **Duração**: Completa do teste

## 🎨 Dicas para UX Team

### 1. Screenshots Rápidos
```bash
# Executar apenas screenshots em todas resoluções
scripts\run-tests.bat screenshots
```

### 2. Testar Fluxo Específico
```bash
# Apenas página inicial
npx cypress run --spec "cypress/e2e/screenshots-ux.cy.ts" --grep "página inicial"
```

### 3. Gerar Relatório
```bash
# Com relatório HTML
npx cypress run --reporter mochawesome
```

## 🐛 Troubleshooting

### Problemas Comuns
1. **Servidor não rodando**: Inicie com `npm run dev`
2. **Timeouts**: Aumente em `cypress.config.ts`
3. **Selectores não encontrados**: Adicione `data-cy` attributes

### Debug Mode
```bash
# Modo debug
npx cypress run --debug
```

## 🔄 Integração CI/CD

### GitHub Actions
```yaml
- name: Run Cypress Tests
  run: npm run cypress:run
```

### Para UX Team
1. Execute `scripts\run-tests.bat screenshots`
2. Envie pasta `cypress/screenshots/` para a equipe
3. Use naming convention para organização

## 📈 Performance

### Testes Rápidos
```bash
# Sem vídeos (mais rápido)
scripts\run-tests.bat rapido
```

### Paralelo
```bash
# Em paralelo (requer Cypress Dashboard)
npx cypress run --parallel
```

---

## 🎯 Próximos Passos

1. **Adicionar data-cy attributes** nos elementos
2. **Criar mais testes** para fluxos específicos
3. **Configurar integração** com ferramentas de design
4. **Automatizar envio** de screenshots para UX Team
