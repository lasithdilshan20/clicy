// Jest setup file
import '@testing-library/jest-dom';

// Mock Cypress global object
// Use a more TypeScript-friendly approach
Object.defineProperty(global, 'Cypress', {
  value: {
    on: jest.fn(),
    // Add other Cypress methods as needed
  },
  writable: true
});

// In Jest's JSDOM environment, window.top is already equal to window
// No need to mock it explicitly
