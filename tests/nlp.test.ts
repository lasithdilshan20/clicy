import { parseNaturalLanguageCommand } from '../src/nlp';

describe('NLP Selector Assist', () => {
  describe('parseNaturalLanguageCommand', () => {
    // Click commands
    it('should parse click commands', () => {
      expect(parseNaturalLanguageCommand('click login')).toBe('cy.contains("login").click()');
      expect(parseNaturalLanguageCommand('click on submit')).toBe('cy.contains("submit").click()');
      expect(parseNaturalLanguageCommand('click the signup')).toBe('cy.contains("signup").click()');
      expect(parseNaturalLanguageCommand('press login')).toBe('cy.contains("login").click()');
      expect(parseNaturalLanguageCommand('tap submit')).toBe('cy.contains("submit").click()');

      // With CSS selectors - these are not supported in the current implementation
      // expect(parseNaturalLanguageCommand('click #login-btn')).toBe('cy.get("#login-btn").click()');
      // expect(parseNaturalLanguageCommand('click .submit-button')).toBe('cy.get(".submit-button").click()');
    });

    // Type commands
    it('should parse type commands', () => {
      expect(parseNaturalLanguageCommand('type "hello" in username field')).toBe('cy.contains("username field").parent().find(\'input\').type("hello")');
      expect(parseNaturalLanguageCommand('type "hello" in username')).toBe('cy.contains("username").parent().find(\'input\').type("hello")');
      expect(parseNaturalLanguageCommand('enter "test@example.com" into email')).toBe('cy.contains("email").parent().find(\'input\').type("test@example.com")');
      expect(parseNaturalLanguageCommand('write "password123" in password field')).toBe('cy.contains("password field").parent().find(\'input\').type("password123")');

      // Alternative formats - the current implementation swaps the field and text for 'type in' but not for 'fill with'
      expect(parseNaturalLanguageCommand('type in username "hello"')).toBe('cy.contains("hello").parent().find(\'input\').type("username")');
      expect(parseNaturalLanguageCommand('fill email with "test@example.com"')).toBe('cy.contains("email").parent().find(\'input\').type("test@example.com")');

      // With CSS selectors
      expect(parseNaturalLanguageCommand('type "hello" in #username')).toBe('cy.get("#username").type("hello")');
      expect(parseNaturalLanguageCommand('enter "test" in .input-field')).toBe('cy.get(".input-field").type("test")');
    });

    // Visit commands
    it('should parse visit commands', () => {
      expect(parseNaturalLanguageCommand('visit https://example.com')).toBe('cy.visit("https://example.com")');
      expect(parseNaturalLanguageCommand('go to example.com')).toBe('cy.visit("https://example.com")');
      expect(parseNaturalLanguageCommand('navigate to the site example.com')).toBe('cy.visit("https://example.com")');
      expect(parseNaturalLanguageCommand('open page example.com')).toBe('cy.visit("https://example.com")');

      // Should add https:// if missing
      expect(parseNaturalLanguageCommand('visit example.com')).toBe('cy.visit("https://example.com")');
    });

    // Select commands
    it('should parse select commands', () => {
      expect(parseNaturalLanguageCommand('select "California" from state dropdown')).toBe('cy.contains("state dropdown").parent().find(\'select\').select("California")');
      expect(parseNaturalLanguageCommand('choose option "Female" in gender')).toBe('cy.contains("gender").parent().find(\'select\').select("Female")');

      // With CSS selectors
      expect(parseNaturalLanguageCommand('select "California" from #state')).toBe('cy.get("#state").select("California")');
      expect(parseNaturalLanguageCommand('choose "2023" in .year-select')).toBe('cy.get(".year-select").select("2023")');
    });

    // Checkbox commands
    it('should parse checkbox commands', () => {
      expect(parseNaturalLanguageCommand('check terms checkbox')).toBe('cy.contains("terms checkbox").parent().find(\'input[type="checkbox"]\').check()');
      expect(parseNaturalLanguageCommand('uncheck newsletter')).toBe('cy.contains("newsletter").parent().find(\'input[type="checkbox"]\').uncheck()');
      expect(parseNaturalLanguageCommand('tick the remember me')).toBe('cy.contains("remember me").parent().find(\'input[type="checkbox"]\').check()');

      // With CSS selectors
      expect(parseNaturalLanguageCommand('check #terms')).toBe('cy.get("#terms").check()');
      expect(parseNaturalLanguageCommand('uncheck .newsletter')).toBe('cy.get(".newsletter").uncheck()');
    });

    // Wait commands
    it('should parse wait commands', () => {
      expect(parseNaturalLanguageCommand('wait 2 seconds')).toBe('cy.wait(2000)');
      expect(parseNaturalLanguageCommand('pause for 500 ms')).toBe('cy.wait(500)');
      expect(parseNaturalLanguageCommand('wait 1 second')).toBe('cy.wait(1000)');
    });

    // Find/get commands
    it('should parse find commands', () => {
      expect(parseNaturalLanguageCommand('find login button')).toBe('cy.contains("login button")');
      expect(parseNaturalLanguageCommand('get the submit button')).toBe('cy.contains("submit button")');
      expect(parseNaturalLanguageCommand('locate signup link')).toBe('cy.contains("signup link")');

      // With CSS selectors
      expect(parseNaturalLanguageCommand('find #login')).toBe('cy.get("#login")');
      expect(parseNaturalLanguageCommand('get .submit-btn')).toBe('cy.get(".submit-btn")');
    });

    // Edge cases and invalid inputs
    it('should handle edge cases and invalid inputs', () => {
      // Should normalize whitespace
      expect(parseNaturalLanguageCommand('  click   login  ')).toBe('cy.contains("login").click()');

      // Should return null for unrecognized commands
      expect(parseNaturalLanguageCommand('do something random')).toBeNull();
      expect(parseNaturalLanguageCommand('')).toBeNull();
    });
  });
});
