
describe('Live Test', () => {
  it('runs REPL steps', () => {
    cy.visit("www.trackman.com");
    cy.contains("Accept all").click();
  });
});
