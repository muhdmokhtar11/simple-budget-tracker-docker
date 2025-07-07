import { accountMenuSelector, loginItemSelector, navbarSelector } from '../../support/commands';

describe('logout', () => {
  beforeEach(() => {
    // Get credentials from environment variables or use defaults
    const username = Cypress.env('E2E_USERNAME');
    const password = Cypress.env('E2E_PASSWORD');

    // Login before each test
    cy.login(username, password);
    cy.visit('');
  });

  it('should redirect to home page and show login option when logged out', () => {
    // Click on account menu
    cy.get(accountMenuSelector).click();

    // Click logout
    cy.get('[data-cy="logout"]').click();

    // Verify we're on the home page
    cy.url().should('include', '/');

    // Verify login option is visible
    cy.get(navbarSelector).within(() => {
      cy.get(accountMenuSelector).click();
      cy.get(loginItemSelector).should('be.visible');
    });

    // Verify we can't access protected resources
    cy.request({
      url: '/api/account',
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.equal(401);
    });
  });
});
