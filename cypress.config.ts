// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'support/e2e.ts',
    baseUrl: 'https://www.trackman.com',
  },
  video: false,
  screenshotOnRunFailure: false,
  watchForFileChanges: true,
});
