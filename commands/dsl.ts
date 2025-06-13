// commands/dsl.ts
// Cypress-style DSL (click, write, goto, etc.)

export const openBrowser = () => `cy.visit('/')`;
export const closeBrowser = () => `// closeBrowser not needed in Cypress`;
export const goto = (url: string) => `cy.visit("${url}");`;
export const click = (label: string) => `cy.contains("${label}").click();`;
export const write = (text: string, field: string) => `cy.contains("${field}").parent().find('input').type("${text}");`;