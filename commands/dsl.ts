// commands/dsl.ts
// Cypress-style DSL (click, write, goto, etc.)

// No longer needed as goto() now handles this functionality
// export const openBrowser = () => `cy.visit('/')`;
export const closeBrowser = () => `// closeBrowser not needed in Cypress`;

// Enhanced goto command that combines openBrowser and goto functionality
export const goto = (url: string) => {
  // If URL is empty or undefined, use default URL (equivalent to old openBrowser)
  if (!url || url === '') {
    return `cy.visit('/')`;
  }

  // Otherwise, visit the specified URL
  return `cy.visit("${url}");`;
};

export const click = (label: string) => `cy.contains("${label}").click();`;
export const write = (text: string, field: string) => `cy.contains("${field}").parent().find('input').type("${text}");`;
