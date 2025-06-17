import { getBestSelector, getSmartSelector, getSelector } from '../src/selectors';
import { queries } from '@testing-library/dom';

// Mock @testing-library/dom's getSuggestedQuery function
jest.mock('@testing-library/dom', () => ({
  queries: {
    getSuggestedQuery: jest.fn(),
  },
}));

describe('Selector Functions', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a container for our test elements
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });
  
  describe('getBestSelector', () => {
    it('should return id selector when element has an id', () => {
      const element = document.createElement('div');
      element.id = 'test-id';
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('#test-id');
    });
    
    it('should return data-testid selector when element has a data-testid', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'test-id');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('[data-testid="test-id"]');
    });
    
    it('should return data-cy selector when element has a data-cy', () => {
      const element = document.createElement('div');
      element.setAttribute('data-cy', 'test-cy');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('[data-cy="test-cy"]');
    });
    
    it('should return class selector when element has a class', () => {
      const element = document.createElement('div');
      element.className = 'test-class';
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('.test-class');
    });
    
    it('should return first class when element has multiple classes', () => {
      const element = document.createElement('div');
      element.className = 'first-class second-class';
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('.first-class');
    });
    
    it('should return name selector when element has a name attribute', () => {
      const element = document.createElement('input');
      element.setAttribute('name', 'test-name');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('[name="test-name"]');
    });
    
    it('should return input type and value selector for inputs', () => {
      const element = document.createElement('input');
      element.setAttribute('type', 'text');
      element.setAttribute('value', 'test-value');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('input[type="text"][value="test-value"]');
    });
    
    it('should return tag with attribute selector as fallback', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-label', 'test-label');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('div[aria-label="test-label"]');
    });
    
    it('should return tag with text content for elements with short text', () => {
      const element = document.createElement('button');
      element.textContent = 'Click me';
      container.appendChild(element);
      
      // Remove all attributes to force text content fallback
      Array.from(element.attributes).forEach(attr => {
        element.removeAttribute(attr.name);
      });
      
      expect(getBestSelector(element)).toBe('button:contains("Click me")');
    });
    
    it('should return just the tag name as last resort', () => {
      const element = document.createElement('span');
      container.appendChild(element);
      
      expect(getBestSelector(element)).toBe('span');
    });
  });
  
  describe('getSmartSelector', () => {
    it('should use testing-library suggestion when available', () => {
      const element = document.createElement('button');
      element.textContent = 'Submit';
      container.appendChild(element);
      
      // Mock the testing-library suggestion
      (queries.getSuggestedQuery as jest.Mock).mockReturnValue({
        queryName: 'getByRole',
        queryValue: 'button',
      });
      
      expect(getSmartSelector(element)).toBe('[role="button"]');
      expect(queries.getSuggestedQuery).toHaveBeenCalledWith(element, 'get');
    });
    
    it('should fall back to getBestSelector when no suggestion is available', () => {
      const element = document.createElement('div');
      element.id = 'test-id';
      container.appendChild(element);
      
      // Mock no suggestion from testing-library
      (queries.getSuggestedQuery as jest.Mock).mockReturnValue(null);
      
      expect(getSmartSelector(element)).toBe('#test-id');
      expect(queries.getSuggestedQuery).toHaveBeenCalledWith(element, 'get');
    });
    
    it('should handle different types of suggestions', () => {
      const element = document.createElement('input');
      container.appendChild(element);
      
      // Test different suggestion types
      const testCases = [
        { queryName: 'getByLabelText', queryValue: 'Username', expected: 'label:contains("Username")' },
        { queryName: 'getByText', queryValue: 'Submit', expected: ':contains("Submit")' },
        { queryName: 'getByTestId', queryValue: 'login-button', expected: '[data-testid="login-button"]' },
        { queryName: 'getByAltText', queryValue: 'Logo', expected: '[alt="Logo"]' },
        { queryName: 'getByTitle', queryValue: 'Help', expected: '[title="Help"]' },
        { queryName: 'getByDisplayValue', queryValue: 'John', expected: '[value="John"]' },
        { queryName: 'getByPlaceholderText', queryValue: 'Enter username', expected: '[placeholder="Enter username"]' },
      ];
      
      testCases.forEach(({ queryName, queryValue, expected }) => {
        (queries.getSuggestedQuery as jest.Mock).mockReturnValue({ queryName, queryValue });
        expect(getSmartSelector(element)).toBe(expected);
      });
    });
    
    it('should handle errors gracefully', () => {
      const element = document.createElement('div');
      element.id = 'test-id';
      container.appendChild(element);
      
      // Mock an error from testing-library
      (queries.getSuggestedQuery as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Should fall back to getBestSelector
      expect(getSmartSelector(element)).toBe('#test-id');
    });
  });
  
  describe('getSelector', () => {
    it('should use smart selector when useSmartSelectors is true', () => {
      const element = document.createElement('button');
      element.textContent = 'Submit';
      container.appendChild(element);
      
      // Mock the testing-library suggestion
      (queries.getSuggestedQuery as jest.Mock).mockReturnValue({
        queryName: 'getByRole',
        queryValue: 'button',
      });
      
      expect(getSelector(element, true)).toBe('[role="button"]');
    });
    
    it('should use basic selector when useSmartSelectors is false', () => {
      const element = document.createElement('div');
      element.id = 'test-id';
      container.appendChild(element);
      
      expect(getSelector(element, false)).toBe('#test-id');
      // getSuggestedQuery should not be called
      expect(queries.getSuggestedQuery).not.toHaveBeenCalled();
    });
  });
});