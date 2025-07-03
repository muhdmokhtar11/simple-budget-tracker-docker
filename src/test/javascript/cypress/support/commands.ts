/* eslint-disable @typescript-eslint/no-namespace */

// ***********************************************
// This commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// ***********************************************
// Begin Specific Selector Attributes for Cypress
// ***********************************************

// Navbar
export const navbarSelector = '[data-cy="navbar"]';
export const adminMenuSelector = '[data-cy="adminMenu"]';
export const accountMenuSelector = '[data-cy="accountMenu"]';
export const registerItemSelector = '[data-cy="register"]';
export const settingsItemSelector = '[data-cy="settings"]';
export const passwordItemSelector = '[data-cy="passwordItem"]';
export const loginItemSelector = '[data-cy="login"]';
export const logoutItemSelector = '[data-cy="logout"]';
export const entityItemSelector = '[data-cy="entity"]';

// Login
export const titleLoginSelector = '[data-cy="loginTitle"]';
export const errorLoginSelector = '[data-cy="loginError"]';
export const usernameLoginSelector = '[data-cy="username"]';
export const passwordLoginSelector = '[data-cy="password"]';
export const forgetYourPasswordSelector = '[data-cy="forgetYourPasswordSelector"]';
export const submitLoginSelector = '[data-cy="submit"]';

// Register
export const usernameRegisterSelector = '[data-cy="username"]';
export const emailRegisterSelector = '[data-cy="email"]';
export const firstPasswordRegisterSelector = '[data-cy="firstPassword"]';
export const secondPasswordRegisterSelector = '[data-cy="secondPassword"]';
export const submitRegisterSelector = '[data-cy="submit"]';

// Settings
export const firstNameSettingsSelector = '[data-cy="firstname"]';
export const lastNameSettingsSelector = '[data-cy="lastname"]';
export const emailSettingsSelector = '[data-cy="email"]';
export const submitSettingsSelector = '[data-cy="submit"]';

// Password
export const currentPasswordSelector = '[data-cy="currentPassword"]';
export const newPasswordSelector = '[data-cy="newPassword"]';
export const confirmPasswordSelector = '[data-cy="confirmPassword"]';
export const submitPasswordSelector = '[data-cy="submit"]';

// Reset Password
export const emailResetPasswordSelector = '[data-cy="emailResetPassword"]';
export const submitInitResetPasswordSelector = '[data-cy="submit"]';

// Administration
export const userManagementPageHeadingSelector = '[data-cy="userManagementPageHeading"]';
export const swaggerFrameSelector = 'iframe[data-cy="swagger-frame"]';
export const swaggerPageSelector = '[id="swagger-ui"]';
export const metricsPageHeadingSelector = '[data-cy="metricsPageHeading"]';
export const healthPageHeadingSelector = '[data-cy="healthPageHeading"]';
export const logsPageHeadingSelector = '[data-cy="logsPageHeading"]';
export const configurationPageHeadingSelector = '[data-cy="configurationPageHeading"]';

// ***********************************************
// End Specific Selector Attributes for Cypress
// ***********************************************

export const classInvalid = 'is-invalid';

export const classValid = 'is-valid';

Cypress.Commands.add('authenticatedRequest', (data: Partial<Cypress.RequestOptions>) => {
  const jwtToken = sessionStorage.getItem(Cypress.env('jwtStorageName'));
  const bearerToken = jwtToken && JSON.parse(jwtToken);

  // Ensure we have a valid request object
  const requestConfig: Partial<Cypress.RequestOptions> = {
    method: 'GET',
    url: '',
    failOnStatusCode: false,
    ...data,
  };

  if (bearerToken) {
    return cy.request({
      ...requestConfig,
      auth: {
        bearer: bearerToken,
      },
    });
  }
  return cy.request(requestConfig);
});

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session(
    [username, password],
    () => {
      // First check if we can reach the backend
      cy.request({
        method: 'GET',
        url: '/api/account',
        failOnStatusCode: false,
      });

      // Authenticate with proper error handling
      const authUrl = Cypress.env('authenticationUrl') || '/api/authenticate';
      cy.authenticatedRequest({
        method: 'POST',
        url: authUrl,
        body: { username, password },
        failOnStatusCode: false,
      }).then(response => {
        if (response.status === 200 && response.body?.id_token) {
          sessionStorage.setItem(Cypress.env('jwtStorageName'), JSON.stringify(response.body.id_token));
        } else {
          // Handle authentication failure gracefully
          cy.log('Authentication failed', response.status, response.body);
        }
      });
    },
    {
      validate() {
        // More robust validation with error handling
        cy.authenticatedRequest({
          method: 'GET',
          url: '/api/account',
          failOnStatusCode: false,
        }).then(response => {
          if (response.status !== 200) {
            // If validation fails, clear the session storage
            sessionStorage.removeItem(Cypress.env('jwtStorageName'));
            throw new Error(`Session validation failed: ${response.status}`);
          }
        });
      },
    },
  );
});

declare global {
  namespace Cypress {
    interface Chainable {
      authenticatedRequest(data: Partial<Cypress.RequestOptions>): Cypress.Chainable<Cypress.Response<any>>;
      login(username: string, password: string): Cypress.Chainable;
    }
  }
}

import 'cypress-audit/commands';
// Convert this to a module instead of a script (allows import/export)
export {};
