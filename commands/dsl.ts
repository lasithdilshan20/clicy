export const closeBrowser = () => `// closeBrowser not needed in Cypress`;

export const goto = (url?: string) => {
  if (url && url !== '') {
    // Add https:// protocol if the URL doesn't have one
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    return `cy.visit("${processedUrl}");`;
  }

  return null;
};

export const click = (selector: string, selectorType: 'contains' | 'get' = 'contains') => {
  return selectorType === 'contains' 
    ? `cy.contains("${selector}").click();`
    : `cy.get("${selector}").click();`;
};

export const write = (text: string, selector: string, selectorType: 'contains' | 'get' = 'contains') => {
  return selectorType === 'contains'
    ? `cy.contains("${selector}").parent().find('input').type("${text}");`
    : `cy.get("${selector}").type("${text}");`;
};
export const get = (selector: string) => `cy.get("${selector}")`;
export const contains = (text: string) => `cy.contains("${text}")`;
