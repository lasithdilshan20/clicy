// Type definitions for Cypress custom configuration options
// This file extends the Cypress namespace to include our custom configuration options

declare namespace Cypress {
  interface EndToEndConfigOptions {
    /**
     * Enable or disable the CliCy REPL panel
     * @default true
     */
    clicyCommand?: boolean;
  }
}