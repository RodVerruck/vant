/**
 * Teste E2E Simples - Validação da Interface
 * Teste robusto que valida a interface sem depender de estados complexos
 */

describe('Teste Simples - Interface Vant', () => {
  
  it('Deve carregar a página inicial e validar elementos principais', () => {
    // Visitar página
    cy.visit('/', { timeout: 10000 })
    
    // Aguardar carregamento
    cy.wait(3000)
    
    // Screenshot inicial
    cy.screenshot('01-pagina-carregada', { capture: 'fullPage' })
    
    // Verificar elementos principais
    cy.get('body').should('be.visible')
    
    // Verificar headline
    cy.contains('Vença o algoritmo ATS', { timeout: 10000 }).should('exist')
    cy.screenshot('02-headline-encontrada')
    
    // Verificar estatísticas
    cy.contains('+34%').should('exist')
    cy.contains('3x').should('exist')
    cy.contains('100%').should('exist')
    cy.screenshot('03-estatisticas-visiveis')
    
    // Verificar formulário
    cy.get('textarea').should('exist')
    cy.screenshot('04-formulario-visivel')
    
    // Verificar botão principal
    cy.contains('ANALISAR CV GRÁTIS').should('exist')
    cy.screenshot('05-botao-principal')
  })

  it('Deve testar interação com textarea', () => {
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    
    // Encontrar e preencher textarea
    cy.get('textarea').first().should('be.visible')
    cy.screenshot('01-textarea-encontrada')
    
    // Digitar texto
    cy.get('textarea').first().type('Desenvolvedor Full Stack Sênior', { delay: 50 })
    cy.wait(500)
    cy.screenshot('02-texto-digitado')
    
    // Limpar
    cy.get('textarea').first().clear()
    cy.screenshot('03-texto-limpo')
  })

  it('Deve testar botões de modo (Com vaga / Sem vaga)', () => {
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    
    // Screenshot inicial
    cy.screenshot('01-estado-inicial')
    
    // Verificar botões existem
    cy.contains('Tenho uma vaga').should('exist')
    cy.contains('Não tenho uma vaga').should('exist')
    cy.screenshot('02-botoes-visiveis')
    
    // Clicar em "Não tenho vaga"
    cy.contains('Não tenho uma vaga').click({ force: true })
    cy.wait(1000)
    cy.screenshot('03-modo-sem-vaga')
    
    // Verificar se dropdown apareceu
    cy.get('select').should('exist')
    cy.screenshot('04-dropdown-visivel')
    
    // Voltar para "Tenho vaga"
    cy.contains('Tenho uma vaga').click({ force: true })
    cy.wait(1000)
    cy.screenshot('05-voltou-modo-com-vaga')
  })

  it('Deve testar upload de arquivo', () => {
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    
    cy.screenshot('01-antes-upload')
    
    // Verificar input file existe
    cy.get('input[type="file"]').should('exist')
    
    // Fazer upload
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/test-cv.txt', { 
      force: true,
      action: 'select'
    })
    
    cy.wait(1000)
    cy.screenshot('02-arquivo-selecionado')
  })

  it('Deve testar responsividade mobile', () => {
    // Mobile
    cy.viewport(375, 667)
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    cy.screenshot('01-mobile-375x667', { capture: 'fullPage' })
    
    // Tablet
    cy.viewport(768, 1024)
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    cy.screenshot('02-tablet-768x1024', { capture: 'fullPage' })
    
    // Desktop
    cy.viewport(1920, 1080)
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    cy.screenshot('03-desktop-1920x1080', { capture: 'fullPage' })
  })

  it('Deve validar seções da página', () => {
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    
    // Seção hero
    cy.screenshot('01-secao-hero', { capture: 'viewport' })
    
    // Scroll para "Por que funciona"
    cy.contains('Por que funciona').scrollIntoView()
    cy.wait(500)
    cy.screenshot('02-secao-por-que-funciona')
    
    // Verificar cards
    cy.contains('IA Treinada').should('exist')
    cy.contains('Critérios ATS').should('exist')
    cy.contains('Padrões de Mercado').should('exist')
    cy.screenshot('03-cards-visiveis')
    
    // Scroll para "Análise Instantânea"
    cy.contains('Análise Instantânea').scrollIntoView()
    cy.wait(500)
    cy.screenshot('04-secao-analise-instantanea')
  })

  it('Deve testar configurações avançadas', () => {
    cy.visit('/', { timeout: 10000 })
    cy.wait(2000)
    
    cy.screenshot('01-antes-abrir-config')
    
    // Procurar e clicar em configurações avançadas
    cy.contains('Configurações Avançadas').should('exist')
    cy.contains('Configurações Avançadas').click({ force: true })
    cy.wait(500)
    cy.screenshot('02-config-abertas')
    
    // Verificar opção de comparativo
    cy.contains('Comparar com outro CV').should('exist')
    cy.screenshot('03-opcao-comparativo-visivel')
  })
})
