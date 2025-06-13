// commands/dsl.ts
// Cypress-style DSL (click, write, goto, etc.)

// No longer needed as goto() now handles this functionality
// export const openBrowser = () => `cy.visit('/')`;
export const closeBrowser = () => `// closeBrowser not needed in Cypress`;

// Enhanced goto command that combines openBrowser and goto functionality
// Now accepts no parameters and will prompt for URL when called
export const goto = (url?: string) => {
  // If URL is provided, use it
  if (url && url !== '') {
    return `cy.visit("${url}");`;
  }

  // If URL is not provided, it will be prompted for in the REPL
  return null;
};

export const click = (label: string) => `cy.contains("${label}").click();`;
export const write = (text: string, field: string) => `cy.contains("${field}").parent().find('input').type("${text}");`;
