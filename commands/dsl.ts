export const closeBrowser = () => `// closeBrowser not needed in Cypress`;

export const goto = (url?: string) => {
  if (url && url !== '') {
    return `cy.visit("${url}");`;
  }

  return null;
};

export const click = (label: string) => `cy.contains("${label}").click();`;
export const write = (text: string, field: string) => `cy.contains("${field}").parent().find('input').type("${text}");`;
