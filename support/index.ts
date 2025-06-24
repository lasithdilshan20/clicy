// This file re-exports the Cypress support file for CliCy
// It allows users to import 'clicy/support' in their Cypress support files

// Import the CliCy support file
import '../cypress/support/e2e';

// Re-export everything
export * from '../cypress/support/e2e';

// This file is the entry point for the 'clicy/support' import
console.log('[CliCy] Support file loaded');