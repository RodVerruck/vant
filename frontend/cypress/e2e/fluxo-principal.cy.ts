describe('Fluxo Principal - Vant', () => {
  beforeEach(() => {
    // Visitar a página inicial
    cy.visit('/')
    // Esperar carregamento completo
    cy.waitForLoading()
    // Screenshot inicial
    cy.takeScreenshot('01-pagina-inicial')
  })

  it('Deve carregar a página inicial corretamente', () => {
    // Verificar elementos principais
    cy.get('body').should('be.visible')
    cy.verifyText('h1', 'Vant')
    cy.takeScreenshot('02-pagina-inicial-carregada')
  })

  it('Deve abrir modal de autenticação', () => {
    // Clicar no botão de login
    cy.waitForAndClick('[data-cy=login-button]')

    // Verificar modal aberto
    cy.get('[data-cy=auth-modal]').should('be.visible')
    cy.verifyText('[data-cy=auth-title]', 'Criar conta para continuar')
    cy.takeScreenshot('03-modal-autenticacao-aberto')
  })

  it('Deve preencher formulário de cadastro', () => {
    // Abrir modal
    cy.waitForAndClick('[data-cy=login-button]')

    // Preencher email
    cy.get('[data-cy=email-input]').type('test@example.com')

    // Preencher senha
    cy.get('[data-cy=password-input]').type('test123456')

    // Confirmar senha (se existir)
    cy.get('[data-cy=password-confirm]').type('test123456')

    cy.takeScreenshot('04-formulario-preenchido')
  })

  it('Deve testar fluxo de upload de CV', () => {
    // Simular login (se necessário)
    // cy.login('test@example.com', 'test123456')

    // Verificar área de upload
    cy.get('[data-cy=cv-upload]').should('be.visible')

    // Fazer upload de CV (se tiver arquivo de teste)
    // cy.uploadFile('[data-cy=cv-upload]', 'test-cv.pdf')

    cy.takeScreenshot('05-area-upload-cv')
  })

  it('Deve navegar para página de planos', () => {
    // Clicar em ver planos
    cy.waitForAndClick('[data-cy=see-plans-button]')

    // Verificar página de planos
    cy.url().should('include', 'pricing')
    cy.verifyText('h1', 'Planos')
    cy.takeScreenshot('06-pagina-planos')
  })

  it('Deve ser responsivo em mobile', () => {
    // Mudar viewport para mobile
    cy.viewport(375, 667)
    cy.visit('/')

    // Verificar layout mobile
    cy.get('body').should('be.visible')
    cy.takeScreenshot('07-layout-mobile')

    // Voltar para desktop
    cy.viewport(1280, 720)
  })

  it('Deve testar acessibilidade', () => {
    // Verificar elementos principais para acessibilidade
    cy.get('[data-cy=main-heading]').should('be.visible')
    cy.get('button').should('have.attr', 'type')
    cy.takeScreenshot('08-acessibilidade')
  })
})
