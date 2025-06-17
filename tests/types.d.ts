// Type definitions for Cypress global variable
declare namespace NodeJS {
  interface Global {
    Cypress: any;
  }
}

// Alternatively, declare it directly on the global object
declare const Cypress: any;

// Add type declaration for @testing-library/dom queries
declare module '@testing-library/dom' {
  export namespace queries {
    export function getSuggestedQuery(element: HTMLElement, variant: string): { queryName: string; queryValue: string } | null;
  }
}
