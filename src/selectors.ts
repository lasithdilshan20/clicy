import { queries } from '@testing-library/dom';

/**
 * Gets the best CSS selector for an element using basic heuristics
 * @param element The HTML element to get a selector for
 * @returns A CSS selector string
 */
export const getBestSelector = (element: HTMLElement): string => {
  // Try to get the id
  if (element.id) {
    return `#${element.id}`;
  }

  // Try to get a data-testid attribute
  if (element.getAttribute('data-testid')) {
    return `[data-testid="${element.getAttribute('data-testid')}"]`;
  }

  // Try to get a data-cy attribute
  if (element.getAttribute('data-cy')) {
    return `[data-cy="${element.getAttribute('data-cy')}"]`;
  }

  // Try to get a class
  if (element.className && typeof element.className === 'string' && element.className.trim()) {
    // Get the first class
    const className = element.className.trim().split(/\s+/)[0];
    return `.${className}`;
  }

  // Try to get a name attribute
  if (element.getAttribute('name')) {
    return `[name="${element.getAttribute('name')}"]`;
  }

  // Try to get a type and value for inputs
  if (element.tagName.toLowerCase() === 'input' && element.getAttribute('type') && element.getAttribute('value')) {
    return `input[type="${element.getAttribute('type')}"][value="${element.getAttribute('value')}"]`;
  }

  // Fallback to tag name with any available attribute
  const tagName = element.tagName.toLowerCase();
  if (element.attributes.length > 0) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name !== 'style' && attr.name !== 'class' && attr.value) {
        return `${tagName}[${attr.name}="${attr.value}"]`;
      }
    }
  }

  // Last resort: tag name with text content if it's short enough
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length < 30) {
    return `${tagName}:contains("${textContent}")`;
  }

  // Absolute fallback
  return tagName;
};

/**
 * Gets a smart selector using @testing-library/dom's getSuggestedQuery
 * @param element The HTML element to get a selector for
 * @returns A CSS selector string
 */
export const getSmartSelector = (element: HTMLElement): string => {
  try {
    // Try to get a suggested query from @testing-library/dom
    const suggestions = queries.getSuggestedQuery(element, 'get');
    
    if (suggestions) {
      // Convert the suggestion to a Cypress-friendly selector
      if (suggestions.queryName === 'getByRole') {
        return `[role="${suggestions.queryValue}"]`;
      } else if (suggestions.queryName === 'getByLabelText') {
        return `label:contains("${suggestions.queryValue}")`;
      } else if (suggestions.queryName === 'getByText') {
        return `:contains("${suggestions.queryValue}")`;
      } else if (suggestions.queryName === 'getByTestId') {
        return `[data-testid="${suggestions.queryValue}"]`;
      } else if (suggestions.queryName === 'getByAltText') {
        return `[alt="${suggestions.queryValue}"]`;
      } else if (suggestions.queryName === 'getByTitle') {
        return `[title="${suggestions.queryValue}"]`;
      } else if (suggestions.queryName === 'getByDisplayValue') {
        return `[value="${suggestions.queryValue}"]`;
      } else if (suggestions.queryName === 'getByPlaceholderText') {
        return `[placeholder="${suggestions.queryValue}"]`;
      }
    }
    
    // If no suggestion found or not convertible to Cypress selector, fall back to getBestSelector
    return getBestSelector(element);
  } catch (error) {
    console.error('[CLICY DEBUG] Error getting smart selector:', error);
    // Fall back to getBestSelector in case of error
    return getBestSelector(element);
  }
};

/**
 * Gets the appropriate selector based on user preference
 * @param element The HTML element to get a selector for
 * @param useSmartSelectors Whether to use smart selectors
 * @returns A CSS selector string
 */
export const getSelector = (element: HTMLElement, useSmartSelectors = true): string => {
  return useSmartSelectors ? getSmartSelector(element) : getBestSelector(element);
};