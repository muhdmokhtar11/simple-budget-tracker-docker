import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
  entityTableSelector,
} from '../../support/entity';

describe('Expense e2e test', () => {
  const expensePageUrl = '/expense';
  const expensePageUrlPattern = new RegExp('/expense(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const expenseSample = { amount: 0, date: '2025-06-23T11:24:56.644Z' };

  let expense;
  let category;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/categories',
      body: { name: 'internationalize likewise consequently', description: 'populist abaft that' },
    }).then(({ body }) => {
      category = body;
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '/api/expenses+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/api/expenses').as('postEntityRequest');
    cy.intercept('DELETE', '/api/expenses/*').as('deleteEntityRequest');
  });

  beforeEach(() => {
    // Simulate relationships api for better performance and reproducibility.
    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: [category],
    });

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [],
    });
  });

  afterEach(() => {
    if (expense) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/expenses/${expense.id}`,
      }).then(() => {
        expense = undefined;
      });
    }
  });

  afterEach(() => {
    if (category) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/categories/${category.id}`,
      }).then(() => {
        category = undefined;
      });
    }
  });

  it('Expenses menu should load Expenses page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('expense');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Expense').should('exist');
    cy.url().should('match', expensePageUrlPattern);
  });

  describe('Expense page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(expensePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Expense page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/expense/new$'));
        cy.getEntityCreateUpdateHeading('Expense');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/api/expenses',
          body: {
            ...expenseSample,
            category,
          },
        }).then(({ body }) => {
          expense = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/api/expenses+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/api/expenses?page=0&size=20>; rel="last",<http://localhost/api/expenses?page=0&size=20>; rel="first"',
              },
              body: [expense],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(expensePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Expense page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('expense');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('edit button click should load edit Expense page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Expense');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('edit button click should load edit Expense page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Expense');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('last delete button click should delete instance of Expense', () => {
        cy.intercept('GET', '/api/expenses/*').as('dialogDeleteRequest');
        cy.get(entityDeleteButtonSelector).last().click();
        cy.wait('@dialogDeleteRequest');
        cy.getEntityDeleteDialogHeading('expense').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);

        expense = undefined;
      });
    });
  });

  describe('new Expense page', () => {
    beforeEach(() => {
      cy.visit(`${expensePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Expense');
    });

    it('should create an instance of Expense', () => {
      cy.get(`[data-cy="amount"]`).type('0');
      cy.get(`[data-cy="amount"]`).should('have.value', '0');

      cy.get(`[data-cy="description"]`).type('precious coaxingly rubbery');
      cy.get(`[data-cy="description"]`).should('have.value', 'precious coaxingly rubbery');

      cy.get(`[data-cy="date"]`).type('2025-06-23T18:24');
      cy.get(`[data-cy="date"]`).blur();
      cy.get(`[data-cy="date"]`).should('have.value', '2025-06-23T18:24');

      cy.get(`[data-cy="category"]`).select(1);

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        expense = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', expensePageUrlPattern);
    });
  });
});
