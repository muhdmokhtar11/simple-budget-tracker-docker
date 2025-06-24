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

describe('Income e2e test', () => {
  const incomePageUrl = '/income';
  const incomePageUrlPattern = new RegExp('/income(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const incomeSample = { amount: 9702.57, date: '2025-06-23T14:46:32.288Z' };

  let income;
  let category;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/categories',
      body: { name: 'lucky gosh on', description: 'yowza entice actually' },
    }).then(({ body }) => {
      category = body;
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '/api/incomes+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/api/incomes').as('postEntityRequest');
    cy.intercept('DELETE', '/api/incomes/*').as('deleteEntityRequest');
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
    if (income) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/incomes/${income.id}`,
      }).then(() => {
        income = undefined;
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

  it('Incomes menu should load Incomes page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('income');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Income').should('exist');
    cy.url().should('match', incomePageUrlPattern);
  });

  describe('Income page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(incomePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Income page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/income/new$'));
        cy.getEntityCreateUpdateHeading('Income');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', incomePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/api/incomes',
          body: {
            ...incomeSample,
            category,
          },
        }).then(({ body }) => {
          income = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/api/incomes+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/api/incomes?page=0&size=20>; rel="last",<http://localhost/api/incomes?page=0&size=20>; rel="first"',
              },
              body: [income],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(incomePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Income page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('income');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', incomePageUrlPattern);
      });

      it('edit button click should load edit Income page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Income');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', incomePageUrlPattern);
      });

      it('edit button click should load edit Income page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Income');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', incomePageUrlPattern);
      });

      it('last delete button click should delete instance of Income', () => {
        cy.intercept('GET', '/api/incomes/*').as('dialogDeleteRequest');
        cy.get(entityDeleteButtonSelector).last().click();
        cy.wait('@dialogDeleteRequest');
        cy.getEntityDeleteDialogHeading('income').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', incomePageUrlPattern);

        income = undefined;
      });
    });
  });

  describe('new Income page', () => {
    beforeEach(() => {
      cy.visit(`${incomePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Income');
    });

    it('should create an instance of Income', () => {
      cy.get(`[data-cy="amount"]`).type('6441.06');
      cy.get(`[data-cy="amount"]`).should('have.value', '6441.06');

      cy.get(`[data-cy="description"]`).type('platypus gee');
      cy.get(`[data-cy="description"]`).should('have.value', 'platypus gee');

      cy.get(`[data-cy="date"]`).type('2025-06-23T21:12');
      cy.get(`[data-cy="date"]`).blur();
      cy.get(`[data-cy="date"]`).should('have.value', '2025-06-23T21:12');

      cy.get(`[data-cy="category"]`).select(1);

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        income = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', incomePageUrlPattern);
    });
  });
});
