describe('Screenshots para UX Team', () => {
  const resolutions = [
    { width: 1920, height: 1080, name: 'desktop-fullhd' },
    { width: 1440, height: 900, name: 'desktop-macbook' },
    { width: 1366, height: 768, name: 'desktop-notebook' },
    { width: 1280, height: 720, name: 'desktop-hd' },
    { width: 1024, height: 768, name: 'tablet-ipad' },
    { width: 768, height: 1024, name: 'tablet-portrait' },
    { width: 375, height: 667, name: 'mobile-iphone' },
    { width: 360, height: 640, name: 'mobile-android' }
  ]

  resolutions.forEach(resolution => {
    describe(`Resolução: ${resolution.name} (${resolution.width}x${resolution.height})`, () => {
      beforeEach(() => {
        cy.viewport(resolution.width, resolution.height)
        cy.visit('/')
        cy.waitForLoading()
      })

      it(`Screenshot página inicial - ${resolution.name}`, () => {
        cy.takeScreenshot(`home-${resolution.name}`)
      })

      it(`Screenshot modal login - ${resolution.name}`, () => {
        cy.waitForAndClick('[data-cy=login-button]')
        cy.takeScreenshot(`modal-login-${resolution.name}`)
      })

      it(`Screenshot página de planos - ${resolution.name}`, () => {
        cy.waitForAndClick('[data-cy=see-plans-button]')
        cy.takeScreenshot(`plans-${resolution.name}`)
      })

      it(`Screenshot hover em botões - ${resolution.name}`, () => {
        cy.get('[data-cy=main-cta]').trigger('mouseover')
        cy.takeScreenshot(`hover-main-cta-${resolution.name}`)
      })
    })
  })

  describe('Screenshots de Estados da Aplicação', () => {
    it('Estado: Loading', () => {
      cy.visit('/')
      // Simular estado de loading se necessário
      cy.takeScreenshot('state-loading')
    })

    it('Estado: Error', () => {
      // Simular estado de erro se necessário
      cy.takeScreenshot('state-error')
    })

    it('Estado: Success', () => {
      // Simular estado de sucesso se necessário
      cy.takeScreenshot('state-success')
    })
  })

  describe('Screenshots de Fluxo Completo', () => {
    it('Fluxo: Visitante → Login → Dashboard', () => {
      cy.visit('/')
      cy.takeScreenshot('fluxo-01-home')
      
      cy.waitForAndClick('[data-cy=login-button]')
      cy.takeScreenshot('fluxo-02-modal-login')
      
      // Preencher formulário
      cy.get('[data-cy=email-input]').type('test@example.com')
      cy.get('[data-cy=password-input]').type('test123456')
      cy.takeScreenshot('fluxo-03-form-preenchido')
      
      // Simular login bem-sucedido
      // cy.get('[data-cy=login-submit]').click()
      cy.takeScreenshot('fluxo-04-dashboard')
    })
  })
})
