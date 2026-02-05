// Comandos personalizados para Cypress

declare global {
  namespace Cypress {
    interface Chainable {
      takeScreenshot(name: string): Chainable<void>
      waitForAndClick(selector: string): Chainable<void>
      login(email: string, password: string): Chainable<void>
      uploadFile(selector: string, fileName: string): Chainable<void>
      verifyText(selector: string, text: string): Chainable<void>
      waitForLoading(): Chainable<void>
    }
  }
}

// Comando para screenshots com configurações otimizadas
Cypress.Commands.add('takeScreenshot', (name: string) => {
  cy.screenshot(name, {
    capture: 'viewport',
    overwrite: true,
    scale: true
  })
})

// Comando para esperar elemento estar visível e clicável
Cypress.Commands.add('waitForAndClick', (selector: string) => {
  cy.get(selector).should('be.visible').and('be.enabled').click()
})

// Comando para login rápido
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/')
  cy.get('[data-cy=login-button]').click()
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=login-submit]').click()
})

// Comando para upload de arquivo
Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.get(selector).selectFile(`cypress/fixtures/${fileName}`)
})

// Comando para verificar texto em elemento
Cypress.Commands.add('verifyText', (selector: string, text: string) => {
  cy.get(selector).should('contain.text', text)
})

// Comando para esperar carregamento
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-cy=loading]').should('not.exist')
})

export {}
