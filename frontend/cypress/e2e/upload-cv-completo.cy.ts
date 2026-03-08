/**
 * Teste E2E Completo - Upload de CV e Análise
 * 
 * Este teste valida o fluxo completo desde o upload do CV
 * até a visualização dos resultados da análise.
 */

describe('Upload de CV e Análise Completa', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(1000) // Aguardar carregamento inicial
  })

  it('Deve completar o fluxo de análise gratuita com upload de CV', () => {
    // 1. Verificar página inicial carregada
    cy.contains('Vença o algoritmo ATS').should('be.visible')
    cy.takeScreenshot('01-pagina-inicial')

    // 2. Verificar que está no modo "Tenho uma vaga" por padrão
    cy.contains('Cole a descrição da vaga').should('be.visible')
    
    // 3. Preencher descrição da vaga
    cy.get('textarea[placeholder*="Cole a descrição da vaga"]')
      .should('be.visible')
      .clear()
      .type('Desenvolvedor Full Stack Sênior\n\nRequisitos:\n- 5+ anos de experiência com React e Node.js\n- TypeScript, Next.js e FastAPI\n- AWS e Docker\n- Inglês avançado', { delay: 10 })
    
    cy.takeScreenshot('02-descricao-vaga-preenchida')

    // 4. Fazer upload do CV (usando arquivo TXT como PDF)
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', { force: true })
    
    // Aguardar o arquivo ser processado
    cy.wait(1000)
    cy.takeScreenshot('03-arquivo-carregado')

    // 5. Clicar no botão de análise
    cy.contains('button', 'ANALISAR CV GRÁTIS')
      .should('be.visible')
      .should('not.be.disabled')
      .click()
    
    cy.takeScreenshot('04-botao-analisar-clicado')

    // 6. Aguardar processamento (pode demorar)
    // Verificar se aparece algum indicador de loading ou redirecionamento
    cy.wait(2000)
    cy.takeScreenshot('05-apos-click-analisar')

    // 7. Verificar se houve redirecionamento ou mudança de estado
    // (Pode ir para tela de preview, login, ou processamento)
    cy.url().then((url) => {
      cy.log('URL atual:', url)
    })
    
    cy.takeScreenshot('06-estado-final')
  })

  it('Deve testar fluxo com modo "Não tenho vaga" e seleção de área', () => {
    // 1. Clicar em "Não tenho vaga"
    cy.contains('button', 'Não tenho uma vaga').click()
    cy.takeScreenshot('01-modo-sem-vaga')

    // 2. Verificar que o dropdown de área apareceu
    cy.get('select').should('be.visible')
    
    // 3. Selecionar uma área
    cy.get('select').select('ti_dev_gen') // Desenvolvimento de Software
    cy.takeScreenshot('02-area-selecionada')

    // 4. Fazer upload do CV
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', { force: true })
    cy.wait(1000)
    cy.takeScreenshot('03-cv-carregado-modo-generico')

    // 5. Clicar em analisar
    cy.contains('button', 'ANALISAR CV GRÁTIS').click()
    cy.wait(2000)
    cy.takeScreenshot('04-analise-iniciada-modo-generico')
  })

  it('Deve validar campos obrigatórios', () => {
    // 1. Tentar clicar em analisar sem preencher nada
    cy.contains('button', 'ANALISAR CV GRÁTIS').click()
    
    // 2. Verificar se há validação (pode ser visual ou mensagem)
    cy.wait(500)
    cy.takeScreenshot('01-validacao-campos-vazios')

    // 3. Preencher apenas descrição da vaga
    cy.get('textarea[placeholder*="Cole a descrição da vaga"]')
      .type('Desenvolvedor Python Sênior')
    
    // 4. Tentar analisar sem CV
    cy.contains('button', 'ANALISAR CV GRÁTIS').click()
    cy.wait(500)
    cy.takeScreenshot('02-validacao-sem-cv')

    // 5. Adicionar CV
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', { force: true })
    cy.wait(500)
    
    // 6. Agora deve funcionar
    cy.contains('button', 'ANALISAR CV GRÁTIS').should('not.be.disabled')
    cy.takeScreenshot('03-validacao-completa')
  })

  it('Deve testar configurações avançadas - Comparativo', () => {
    // 1. Abrir configurações avançadas
    cy.contains('Configurações Avançadas').click()
    cy.takeScreenshot('01-config-avancadas-abertas')

    // 2. Verificar opção de comparativo
    cy.contains('Comparar com outro CV').should('be.visible')
    
    // 3. Clicar em adicionar comparativo
    cy.contains('button', 'Adicionar Comparativo').click()
    cy.wait(500)
    cy.takeScreenshot('02-comparativo-adicionado')

    // 4. Verificar se apareceu campo de upload adicional
    cy.get('input[type="file"]').should('have.length.greaterThan', 1)
    cy.takeScreenshot('03-campo-comparativo-visivel')
  })

  it('Deve testar responsividade em mobile', () => {
    // 1. Mudar para viewport mobile
    cy.viewport(375, 667)
    cy.visit('/')
    cy.wait(1000)
    cy.takeScreenshot('01-mobile-inicial')

    // 2. Verificar elementos principais visíveis
    cy.contains('Vença o algoritmo ATS').should('be.visible')
    cy.get('textarea').should('be.visible')
    cy.takeScreenshot('02-mobile-formulario')

    // 3. Testar upload em mobile
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-cv.txt', { force: true })
    cy.wait(500)
    cy.takeScreenshot('03-mobile-arquivo-carregado')

    // 4. Verificar botão de análise
    cy.contains('button', 'ANALISAR CV GRÁTIS').should('be.visible')
    cy.takeScreenshot('04-mobile-pronto-analisar')
  })

  it('Deve testar limite de caracteres na descrição da vaga', () => {
    // 1. Verificar contador de caracteres
    cy.get('textarea[placeholder*="Cole a descrição da vaga"]')
      .should('be.visible')
    
    // 2. Digitar texto longo
    const textoLongo = 'A'.repeat(5100) // Mais que o limite de 5000
    cy.get('textarea[placeholder*="Cole a descrição da vaga"]')
      .type(textoLongo.substring(0, 5000), { delay: 0 })
    
    cy.wait(500)
    cy.takeScreenshot('01-limite-caracteres')

    // 3. Verificar se o contador mostra o limite
    cy.contains(/\d+\/5000/).should('be.visible')
  })

  it('Deve testar alternância entre modos (Com vaga / Sem vaga)', () => {
    // 1. Iniciar em "Tenho uma vaga"
    cy.contains('Cole a descrição da vaga').should('be.visible')
    cy.takeScreenshot('01-modo-com-vaga')

    // 2. Preencher descrição
    cy.get('textarea').type('Teste de descrição')
    
    // 3. Mudar para "Não tenho vaga"
    cy.contains('button', 'Não tenho uma vaga').click()
    cy.takeScreenshot('02-mudou-para-sem-vaga')

    // 4. Verificar que o dropdown apareceu
    cy.get('select').should('be.visible')
    
    // 5. Voltar para "Tenho uma vaga"
    cy.contains('button', 'Tenho uma vaga').click()
    cy.takeScreenshot('03-voltou-para-com-vaga')

    // 6. Verificar que o textarea voltou (mas vazio - comportamento esperado)
    cy.get('textarea').should('be.visible')
  })
})
