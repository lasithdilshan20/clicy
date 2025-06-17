
describe('Live Test', () => {
  it('runs REPL steps', () => {
    cy.visit("https://www.ebay.com")
    cy.get(".gh-search-button__label").should("be.visible")
    cy.wait(3000)
    cy.get("#gh-ac").type("Apple iphone")
    cy.get(".gh-search-button__label").click()
  });
});
