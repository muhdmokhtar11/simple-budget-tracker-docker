/* eslint-disable @typescript-eslint/no-namespace */

// Simplified authentication for coverage testing
// This bypasses session management which can be problematic with instrumented code

Cypress.Commands.add('loginForCoverage', (username: string = 'admin', password: string = 'admin') => {
  // Skip session management during coverage testing to avoid issues
  cy.log('Logging in for coverage testing...');

  // Try to get account info first to check if already logged in
  cy.request({
    method: 'GET',
    url: '/api/account',
    failOnStatusCode: false,
  }).then(response => {
    if (response.status === 401) {
      // Need to authenticate
      cy.log('Authenticating...');
      cy.request({
        method: 'POST',
        url: '/api/authenticate',
        body: { username, password },
        failOnStatusCode: false,
      }).then(authResponse => {
        if (authResponse.status === 200 && authResponse.body?.id_token) {
          const token = authResponse.body.id_token;
          // Store token for subsequent requests
          window.sessionStorage.setItem('jhi-authenticationToken', JSON.stringify(token));
          cy.log('Authentication successful');
        } else {
          cy.log('Authentication failed', authResponse.status);
        }
      });
    } else {
      cy.log('Already authenticated');
    }
  });
});

// Simple request wrapper that adds auth header if token exists
Cypress.Commands.add('requestWithAuth', (options: Partial<Cypress.RequestOptions>) => {
  const token = window.sessionStorage.getItem('jhi-authenticationToken');
  let headers = options.headers || {};

  if (token) {
    try {
      const parsedToken = JSON.parse(token);
      headers = {
        ...headers,
        Authorization: `Bearer ${parsedToken}`,
      };
    } catch (e) {
      cy.log('Failed to parse auth token');
    }
  }

  return cy.request({
    ...options,
    headers,
    failOnStatusCode: false,
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginForCoverage(username?: string, password?: string): Cypress.Chainable;
      requestWithAuth(options: Partial<Cypress.RequestOptions>): Cypress.Chainable<Cypress.Response<any>>;
    }
  }
}

export {};
