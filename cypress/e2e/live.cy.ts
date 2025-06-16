
describe('Live Test', () => {
  it('runs REPL steps', () => {
    cy.visit("https://www.ebay.com")
    cy.get(".gh-search-input").type("Apple Airpod Max")
    cy.contains("Search").click()
    cy.get("#gh-search-button").click()
  });
});
