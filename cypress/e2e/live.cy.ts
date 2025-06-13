
describe('Live Test', () => {
  it('runs REPL steps', () => {
    cy.contains("cookies").click();
    cy.visit("https://trackman.com/");
    cy.contains("Accept All").click();
  });
});
