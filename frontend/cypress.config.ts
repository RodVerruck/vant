import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false,  // ❌ Sem vídeos
    screenshotOnRunFailure: true,
    viewportWidth: 1366,  // ✅ Apenas notebook
    viewportHeight: 768,
    defaultCommandTimeout: 5000,
    requestTimeout: 5000,
    responseTimeout: 5000,
    retries: {
      runMode: 1,
      openMode: 0
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }
})
