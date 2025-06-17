// =============================================================================
// 🧭 Navigation & Origin Commands
// =============================================================================

/**
 * Navigate to a URL
 * @param url The URL to navigate to
 * @returns Cypress command string
 * @example visit("https://example.com")
 */
export const visit = (url: string) => {
  // Add https:// protocol if the URL doesn't have one
  let processedUrl = url;
  if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
    processedUrl = 'https://' + processedUrl;
  }
  return `cy.visit("${processedUrl}");`;
};

/**
 * Alias for visit - Navigate to a URL
 * @param url The URL to navigate to
 * @returns Cypress command string
 * @example goto("https://example.com")
 */
export const goto = (url?: string) => {
  if (url && url !== '') {
    return visit(url);
  }
  return null;
};

/**
 * Execute commands in the context of a different origin
 * @param host The host to execute commands in
 * @param fn The function containing commands to execute
 * @returns Cypress command string
 * @example origin("https://example.com", () => { cy.get(".button").click() })
 */
export const origin = (host: string, fn: string) => {
  return `cy.origin("${host}", () => { ${fn} });`;
};

// =============================================================================
// 🎯 Action Commands
// =============================================================================

/**
 * Click on an element
 * @param selector The selector or text to find the element
 * @param selectorType The type of selector (contains or get)
 * @returns Cypress command string
 * @example click(".button", "get")
 */
export const click = (selector: string, selectorType: 'contains' | 'get' = 'contains') => {
  return selectorType === 'contains' 
    ? `cy.contains("${selector}").click();`
    : `cy.get("${selector}").click();`;
};

/**
 * Type text into an input field
 * @param text The text to type
 * @param selector The selector or text to find the input
 * @param selectorType The type of selector (contains or get)
 * @returns Cypress command string
 * @example write("Hello", "#input", "get")
 */
export const write = (text: string, selector: string, selectorType: 'contains' | 'get' = 'contains') => {
  return selectorType === 'contains'
    ? `cy.contains("${selector}").parent().find('input').type("${text}");`
    : `cy.get("${selector}").type("${text}");`;
};

/**
 * Type text into an input field (alias for write)
 * @param text The text to type
 * @param selector The selector to find the input
 * @returns Cypress command string
 * @example type("Hello", "#input")
 */
export const type = (text: string, selector: string) => {
  return `cy.get("${selector}").type("${text}");`;
};

/**
 * Clear the content of an input field
 * @param selector The selector to find the input
 * @returns Cypress command string
 * @example clear("#input")
 */
export const clear = (selector: string) => {
  return `cy.get("${selector}").clear();`;
};

/**
 * Check a checkbox or radio button
 * @param selector The selector to find the checkbox
 * @returns Cypress command string
 * @example check("#checkbox")
 */
export const check = (selector: string) => {
  return `cy.get("${selector}").check();`;
};

/**
 * Uncheck a checkbox
 * @param selector The selector to find the checkbox
 * @returns Cypress command string
 * @example uncheck("#checkbox")
 */
export const uncheck = (selector: string) => {
  return `cy.get("${selector}").uncheck();`;
};

/**
 * Select an option from a dropdown
 * @param selector The selector to find the select element
 * @param value The value to select
 * @returns Cypress command string
 * @example select("#dropdown", "Option 1")
 */
export const select = (selector: string, value: string) => {
  return `cy.get("${selector}").select("${value}");`;
};

/**
 * Get an element by selector
 * @param selector The selector to find the element
 * @returns Cypress command string
 * @example get("#element")
 */
export const get = (selector: string) => `cy.get("${selector}");`;

/**
 * Find an element containing specific text
 * @param text The text to search for
 * @returns Cypress command string
 * @example contains("Submit")
 */
export const contains = (text: string) => `cy.contains("${text}");`;

// =============================================================================
// 🧪 Assertion Commands
// =============================================================================

/**
 * Assert that an element contains specific text
 * @param selector The selector to find the element
 * @param text The text to assert
 * @returns Cypress command string
 * @example shouldContain("#element", "Expected text")
 */
export const shouldContain = (selector: string, text: string) => {
  return `cy.get("${selector}").should("contain", "${text}");`;
};

/**
 * Assert that an element is visible
 * @param selector The selector to find the element
 * @returns Cypress command string
 * @example shouldBeVisible("#element")
 */
export const shouldBeVisible = (selector: string) => {
  return `cy.get("${selector}").should("be.visible");`;
};

/**
 * Assert that an element has a specific value
 * @param selector The selector to find the element
 * @param value The value to assert
 * @returns Cypress command string
 * @example shouldHaveValue("#input", "Expected value")
 */
export const shouldHaveValue = (selector: string, value: string) => {
  return `cy.get("${selector}").should("have.value", "${value}");`;
};

// =============================================================================
// 🌐 Network & Session Commands
// =============================================================================

/**
 * Intercept a network request
 * @param method The HTTP method to intercept
 * @param url The URL to intercept
 * @param alias The alias to assign to the interception
 * @returns Cypress command string
 * @example intercept("GET", "/api/users", "getUsers")
 */
export const intercept = (method: string, url: string, alias: string) => {
  return `cy.intercept("${method}", "${url}").as("${alias}");`;
};

/**
 * Wait for an aliased resource to resolve
 * @param alias The alias to wait for
 * @returns Cypress command string
 * @example waitForAlias("getUsers")
 */
export const waitForAlias = (alias: string) => {
  return `cy.wait("@${alias}");`;
};

/**
 * Create or restore a session
 * @param name The name of the session
 * @param setup The setup function for the session
 * @returns Cypress command string
 * @example session("user", () => { cy.login() })
 */
export const session = (name: string, setup: string) => {
  return `cy.session("${name}", () => { ${setup} });`;
};

// =============================================================================
// 🛠 Utility Commands
// =============================================================================

/**
 * Wait for a specified amount of time
 * @param ms The number of milliseconds to wait
 * @returns Cypress command string
 * @example wait(1000)
 */
export const wait = (ms: number) => {
  return `cy.wait(${ms});`;
};

/**
 * Reload the current page
 * @returns Cypress command string
 * @example reload()
 */
export const reload = () => {
  return `cy.reload();`;
};

/**
 * Take a screenshot
 * @param name The name of the screenshot
 * @returns Cypress command string
 * @example screenshot("homepage")
 */
export const screenshot = (name: string) => {
  return `cy.screenshot("${name}");`;
};

/**
 * Not needed in Cypress - included for compatibility
 * @returns Comment string
 */
export const closeBrowser = () => `// closeBrowser not needed in Cypress`;
