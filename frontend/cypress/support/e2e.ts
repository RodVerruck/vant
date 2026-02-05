// Importar comandos personalizados
import './commands'

// Comandos globais para screenshots
Cypress.Commands.add('takeScreenshot', (name: string) => {
  cy.screenshot(name, {
    capture: 'viewport',
    overwrite: true
  })
})

// Comando para esperar elemento estar visível e clicável
Cypress.Commands.add('waitForAndClick', (selector: string) => {
  cy.get(selector).should('be.visible').and('be.enabled').click()
})

// Comando para login rápido (se necessário)
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

// Global beforeEach para limpeza
beforeEach(() => {
  // Limpar localStorage antes de cada teste
  cy.clearLocalStorage()
  // Limpar cookies
  cy.clearCookies()
})
