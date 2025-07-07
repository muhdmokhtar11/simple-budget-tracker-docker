import { Store } from '@reduxjs/toolkit';

// Extend the Window type to include our Redux store
declare global {
  interface Window {
    store: Store;
  }
}

describe('Currency Formatter Tests', () => {
  beforeEach(() => {
    cy.visit('/expense');
    cy.wait(1000); // Wait for data to load
  });

  it('should format USD currency values correctly', () => {
    // Create a test expense with a known amount
    cy.window().then(win => {
      // Add test data to Redux store
      win.store.dispatch({
        type: 'expense/addEntity',
        payload: {
          id: 999,
          amount: 1234.56,
          description: 'Test Expense',
          date: new Date().toISOString(),
          category: null,
          user: null,
        },
      });
    });

    // Verify that currency values are formatted correctly
    cy.get('[data-testid="currency-value"]').should('exist').and('contain', '$').and('contain', '1,234.56');
  });

  it('should format EUR currency values correctly', () => {
    cy.window().then(win => {
      // Add test data with EUR
      win.store.dispatch({
        type: 'expense/addEntity',
        payload: {
          id: 1000,
          amount: 2345.67,
          description: 'Test EUR Expense',
          date: new Date().toISOString(),
          category: null,
          user: null,
          currency: 'EUR',
        },
      });
    });

    // Verify EUR formatting
    cy.get('[data-testid="currency-value"]').should('exist').and('contain', '€').and('contain', '2,345.67');
  });

  it('should handle zero and negative amounts correctly', () => {
    cy.window().then(win => {
      // Add test data with zero and negative amounts
      win.store.dispatch({
        type: 'expense/addEntity',
        payload: [
          {
            id: 1001,
            amount: 0,
            description: 'Zero Amount',
            date: new Date().toISOString(),
            category: null,
            user: null,
          },
          {
            id: 1002,
            amount: -500.25,
            description: 'Negative Amount',
            date: new Date().toISOString(),
            category: null,
            user: null,
          },
        ],
      });
    });

    // Verify zero amount
    cy.get('[data-testid="currency-value"]').should('exist').and('contain', '$0.00');

    // Verify negative amount
    cy.get('[data-testid="currency-value"]').should('exist').and('contain', '-$500.25');
  });

  it('should handle invalid currency gracefully', () => {
    cy.window().then(win => {
      const spy = cy.spy(win.console, 'error');

      // Add test data with invalid currency
      win.store.dispatch({
        type: 'expense/addEntity',
        payload: {
          id: 1003,
          amount: 100,
          description: 'Invalid Currency Test',
          date: new Date().toISOString(),
          category: null,
          user: null,
          currency: 'INVALID',
        },
      });

      // Verify error was logged and fallback formatting was used
      cy.wrap(spy).should('be.called');
      cy.get('[data-testid="currency-value"]').should('exist').and('contain', 'INVALID 100.00');
    });
  });
});
