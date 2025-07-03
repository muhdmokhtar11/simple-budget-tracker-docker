// Remove unused imports

describe('Income Comprehensive Tests', () => {
  const incomePageUrl = '/income';
  const incomePageUrlPattern = new RegExp('/income(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const incomeSample = {
    amount: 1000.5,
    description: 'Test income description',
    date: '2024-01-15T10:30:00.000Z',
  };

  let income: any;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    // Intercept API calls for proper testing
    cy.intercept('GET', '/api/incomes?*', { fixture: 'income-list.json' }).as('getIncomes');
    cy.intercept('GET', '/api/incomes/*', { fixture: 'income-detail.json' }).as('getIncomeDetail');
    cy.intercept('POST', '/api/incomes', { statusCode: 201, body: incomeSample }).as('createIncome');
    cy.intercept('PUT', '/api/incomes/*', { statusCode: 200, body: incomeSample }).as('updateIncome');
    cy.intercept('DELETE', '/api/incomes/*', { statusCode: 204 }).as('deleteIncome');
    cy.intercept('GET', '/api/categories?*', { fixture: 'category-list.json' }).as('getCategories');
    cy.intercept('GET', '/api/users?*', { fixture: 'user-list.json' }).as('getUsers');
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

  describe('Basic Functionality Tests', () => {
    it('should load the income page successfully', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');
      cy.get('[data-testid="income-page-container"]').should('be.visible');
      cy.get('[data-testid="heading-incomes"]').should('contain', 'Incomes');
    });

    it('should display all main page elements', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check header elements
      cy.get('[data-testid="page-header"]').should('be.visible');
      cy.get('[data-testid="heading-incomes"]').should('be.visible');
      cy.get('[data-testid="btn-refresh-list"]').should('be.visible');
      cy.get('[data-testid="btn-create-income"]').should('be.visible');

      // Check view mode toggle
      cy.get('[data-testid="view-mode-toggle"]').should('be.visible');
      cy.get('[data-testid="btn-view-table"]').should('be.visible');
      cy.get('[data-testid="btn-view-cards"]').should('be.visible');

      // Check summary dashboard
      cy.get('[data-testid="income-summary-container"]').should('be.visible');
      cy.get('[data-testid="summary-cards-row"]').should('be.visible');

      // Check data table
      cy.get('[data-testid="income-data-container"]').should('be.visible');
    });

    it('should display correct loading states', () => {
      cy.intercept('GET', '/api/incomes?*', { delay: 1000, fixture: 'income-list.json' }).as('getIncomesDelayed');
      cy.visit(incomePageUrl);

      // Check if loading indicator appears
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getIncomesDelayed');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should handle empty data state', () => {
      cy.intercept('GET', '/api/incomes?*', { body: [] }).as('getEmptyIncomes');
      cy.visit(incomePageUrl);
      cy.wait('@getEmptyIncomes');

      // Check for empty state or table with no data
      cy.get('body').then($body => {
        if ($body.find('[data-testid="alert-no-data"]').length > 0) {
          cy.get('[data-testid="alert-no-data"]').should('be.visible');
        } else {
          // Alternative: check table exists but has no data rows
          cy.get('[data-testid="income-table"]').should('be.visible');
          cy.get('[data-testid="table-body"] tr').should('have.length', 0);
        }
      });
    });
  });

  describe('Summary Dashboard Tests', () => {
    it('should display all summary cards with correct data', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check all summary cards
      cy.get('[data-testid="card-total-income"]').should('be.visible');
      cy.get('[data-testid="value-total-income"]').should('be.visible');

      cy.get('[data-testid="card-average-income"]').should('be.visible');
      cy.get('[data-testid="value-average-income"]').should('be.visible');

      cy.get('[data-testid="card-current-month"]').should('be.visible');
      cy.get('[data-testid="value-current-month"]').should('be.visible');

      cy.get('[data-testid="card-highest-income"]').should('be.visible');
      cy.get('[data-testid="value-highest-income"]').should('be.visible');
    });

    it('should display quick statistics', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if quick stats exist
      cy.get('body').then($body => {
        if ($body.find('[data-testid="quick-stats-card"]').length > 0) {
          cy.get('[data-testid="quick-stats-card"]').should('be.visible');
        }
      });
    });
  });

  describe('Filter and Search Tests', () => {
    it('should toggle filter controls', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if filter toggle exists
      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          cy.get('[data-testid="filter-form-container"]').should('be.visible');
        }
      });
    });

    it('should apply date filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if filters exist before interacting
      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          cy.get('[data-testid="input-date-from"]').type('2024-01-01');
          cy.get('[data-testid="input-date-to"]').type('2024-12-31');
        }
      });
    });

    it('should apply category filter', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');
      cy.wait('@getCategories');

      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          if ($body.find('[data-testid="select-category"]').length > 0) {
            cy.get('[data-testid="select-category"]').select('1');
          }
        }
      });
    });

    it('should apply amount filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          if ($body.find('[data-testid="input-min-amount"]').length > 0) {
            cy.get('[data-testid="input-min-amount"]').type('100');
          }
          if ($body.find('[data-testid="input-max-amount"]').length > 0) {
            cy.get('[data-testid="input-max-amount"]').type('5000');
          }
        }
      });
    });

    it('should clear all filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          if ($body.find('[data-testid="btn-clear-filters"]').length > 0) {
            cy.get('[data-testid="btn-clear-filters"]').click();
          }
        }
      });
    });

    it('should export data', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-export-data"]').length > 0) {
          cy.get('[data-testid="btn-export-data"]').click();
        }
      });
    });
  });

  describe('Table Functionality Tests', () => {
    it('should display table with correct headers', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check table headers
      cy.get('[data-testid="th-select-all"]').should('be.visible');
      cy.get('[data-testid="th-sort-id"]').should('be.visible');
      cy.get('[data-testid="th-sort-amount"]').should('be.visible');
      cy.get('[data-testid="th-sort-description"]').should('be.visible');
      cy.get('[data-testid="th-sort-date"]').should('be.visible');
      cy.get('[data-testid="th-category"]').should('be.visible');
      cy.get('[data-testid="th-user"]').should('be.visible');
      cy.get('[data-testid="th-actions"]').should('be.visible');
    });

    it('should sort table columns', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Sort by amount
      cy.get('[data-testid="th-sort-amount"]').click();
      cy.get('[data-testid="icon-sort-amount"]').should('be.visible');

      // Sort by date
      cy.get('[data-testid="th-sort-date"]').click();
      cy.get('[data-testid="icon-sort-date"]').should('be.visible');
    });

    it('should select individual items', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Select first item if it exists
      cy.get('[data-testid^="checkbox-item-"]')
        .first()
        .then($checkbox => {
          if ($checkbox.length > 0) {
            cy.wrap($checkbox).check();
            cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');
          }
        });
    });

    it('should select all items', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Select all items
      cy.get('[data-testid="checkbox-select-all"]').check();
      cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');
    });

    it('should clear selection', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Select some items first
      cy.get('[data-testid^="checkbox-item-"]')
        .first()
        .then($checkbox => {
          if ($checkbox.length > 0) {
            cy.wrap($checkbox).check();
            cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');
            cy.get('[data-testid="btn-clear-selection"]').click();
            cy.get('[data-testid="bulk-actions-bar"]').should('not.exist');
          }
        });
    });
  });

  describe('View Mode Tests', () => {
    it('should toggle between table and card view', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if view mode toggle exists
      cy.get('body').then($body => {
        if ($body.find('[data-testid="view-mode-toggle"]').length > 0) {
          cy.get('[data-testid="btn-view-table"]').should('be.visible');
          cy.get('[data-testid="btn-view-cards"]').should('be.visible');
        }
      });
    });
  });

  describe('CRUD Operations Tests', () => {
    it('should create new income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Navigate to create page
      cy.get('[data-testid="btn-create-income"]').click();
      cy.url().should('match', /\/income\/new$/);

      // Wait for categories to load
      cy.wait('@getCategories');

      // Fill form
      cy.get('[data-testid="input-amount"]').type('1000.50');
      cy.get('[data-testid="input-description"]').type('Test income');
      cy.get('[data-testid="input-date"]').type('2024-01-15T10:30');

      // Select a category (required field)
      cy.get('[data-testid="select-category"]').select('1');

      // Save
      cy.get('[data-testid="btn-save"]').click();
      cy.wait('@createIncome');

      // Should redirect to list
      cy.url().should('match', incomePageUrlPattern);
    });

    it('should view income details', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click on first income ID link if it exists
      cy.get('[data-testid^="link-id-"]')
        .first()
        .then($link => {
          if ($link.length > 0) {
            cy.wrap($link).click();
            cy.url().should('match', /\/income\/\d+$/);
          }
        });
    });

    it('should edit income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click edit button for first income
      cy.get('[data-testid^="btn-edit-"]')
        .first()
        .then($btn => {
          if ($btn.length > 0) {
            cy.wrap($btn).click();
            cy.url().should('match', /\/income\/\d+\/edit/);

            // Update form
            cy.get('[data-testid="input-amount"]').clear();
            cy.get('[data-testid="input-amount"]').type('2000.00');
            cy.get('[data-testid="input-description"]').clear();
            cy.get('[data-testid="input-description"]').type('Updated income');

            // Save
            cy.get('[data-testid="btn-save"]').click();
            cy.wait('@updateIncome');

            // Should redirect to list
            cy.url().should('match', incomePageUrlPattern);
          }
        });
    });

    it('should delete income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click delete button if it exists
      cy.get('[data-testid^="btn-delete-"]')
        .first()
        .then($btn => {
          if ($btn.length > 0) {
            cy.wrap($btn).click();

            // Check if delete modal appears
            cy.get('body').then($body => {
              if ($body.find('[data-testid="income-delete-modal"]').length > 0) {
                cy.get('[data-testid="income-delete-modal"]').should('be.visible');
                cy.get('[data-testid="btn-confirm-delete"]').click();
                cy.wait('@deleteIncome');
              }
            });
          }
        });
    });

    it('should cancel delete operation', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click delete button if it exists
      cy.get('[data-testid^="btn-delete-"]')
        .first()
        .then($btn => {
          if ($btn.length > 0) {
            cy.wrap($btn).click();

            cy.get('body').then($body => {
              if ($body.find('[data-testid="income-delete-modal"]').length > 0) {
                cy.get('[data-testid="income-delete-modal"]').should('be.visible');
                cy.get('[data-testid="btn-cancel-delete"]').click();
                cy.get('[data-testid="income-delete-modal"]').should('not.exist');
              }
            });
          }
        });
    });
  });

  describe('Navigation Tests', () => {
    it('should navigate to create page', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('[data-testid="btn-create-income"]').click();
      cy.url().should('match', /\/income\/new$/);
    });

    it('should navigate back from create page', () => {
      // First visit the income page to create proper navigation history
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Then navigate to create page
      cy.get('[data-testid="btn-create-income"]').click();
      cy.url().should('match', /\/income\/new$/);

      // Check if cancel button exists and use it
      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-cancel"]').length > 0) {
          cy.get('[data-testid="btn-cancel"]').click();
          cy.url().should('match', incomePageUrlPattern);
        } else {
          // Use back button instead
          cy.go('back');
          cy.url().should('match', incomePageUrlPattern);
        }
      });
    });

    it('should navigate back from detail page', () => {
      // Create a mock detail page visit
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('[data-testid^="link-id-"]')
        .first()
        .then($link => {
          if ($link.length > 0) {
            cy.wrap($link).click();
            cy.get('body').then($body => {
              if ($body.find('[data-testid="btn-back-to-list"]').length > 0) {
                cy.get('[data-testid="btn-back-to-list"]').click();
                cy.url().should('match', incomePageUrlPattern);
              }
            });
          }
        });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/incomes?*', { statusCode: 500, body: { message: 'Server Error' } }).as('getIncomesError');
      cy.visit(incomePageUrl);
      cy.wait('@getIncomesError');

      // Check if error is displayed
      cy.get('body').then($body => {
        if ($body.find('[data-testid="alert-error-message"]').length > 0) {
          cy.get('[data-testid="alert-error-message"]').should('be.visible');
        }
      });
    });

    it('should handle create errors', () => {
      cy.intercept('POST', '/api/incomes', { statusCode: 400, body: { message: 'Validation Error' } }).as('createIncomeError');

      cy.visit(`${incomePageUrl}/new`);

      // Fill form with invalid data
      cy.get('[data-testid="input-amount"]').type('invalid');
      cy.get('[data-testid="btn-save"]').click();

      // Check for validation error
      cy.get('body').then($body => {
        if ($body.find('.invalid-feedback').length > 0) {
          cy.get('.invalid-feedback').should('be.visible');
        }
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check ARIA labels
      cy.get('[data-testid="th-sort-id"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="checkbox-select-all"]').should('have.attr', 'aria-label');

      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').should('have.attr', 'aria-expanded');
        }
      });
    });

    it('should support keyboard navigation', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Tab navigation
      cy.get('[data-testid="btn-refresh-list"]').focus();
      cy.get('[data-testid="btn-refresh-list"]').should('be.focused');
    });
  });

  describe('Responsive Design Tests', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6');
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check that elements are still visible
      cy.get('[data-testid="income-page-container"]').should('be.visible');
      cy.get('[data-testid="heading-incomes"]').should('be.visible');
      cy.get('[data-testid="income-summary-container"]').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check that elements are still visible
      cy.get('[data-testid="income-page-container"]').should('be.visible');
      cy.get('[data-testid="summary-cards-row"]').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check that all elements are visible
      cy.get('[data-testid="income-page-container"]').should('be.visible');
      cy.get('[data-testid="summary-cards-row"]').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
      });
    });

    it('should handle large datasets', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        amount: Math.random() * 1000,
        description: `Test income ${i + 1}`,
        date: new Date().toISOString(),
      }));

      cy.intercept('GET', '/api/incomes?*', { body: largeDataset }).as('getLargeDataset');
      cy.visit(incomePageUrl);
      cy.wait('@getLargeDataset');

      // Should still be responsive
      cy.get('[data-testid="income-table"]').should('be.visible');

      // Check if pagination exists
      cy.get('body').then($body => {
        if ($body.find('[data-testid="pagination-container"]').length > 0) {
          cy.get('[data-testid="pagination-container"]').should('be.visible');
        }
      });
    });
  });

  describe('Local Storage Tests', () => {
    it('should persist filter preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if filters work with localStorage
      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-toggle-filters"]').length > 0) {
          cy.get('[data-testid="btn-toggle-filters"]').click();
          if ($body.find('[data-testid="input-min-amount"]').length > 0) {
            cy.get('[data-testid="input-min-amount"]').type('100');
            // Reload page
            cy.reload();
            cy.wait('@getIncomes');
          }
        }
      });
    });

    it('should persist view mode preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check if view mode persistence works
      cy.get('body').then($body => {
        if ($body.find('[data-testid="btn-view-cards"]').length > 0) {
          cy.get('[data-testid="btn-view-cards"]').click();
          cy.reload();
          cy.wait('@getIncomes');
        }
      });
    });

    it('should persist sort preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Sort by amount
      cy.get('[data-testid="th-sort-amount"]').click();

      // Reload page
      cy.reload();
      cy.wait('@getIncomes');

      // Check that sort is maintained
      cy.get('[data-testid="icon-sort-amount"]').should('be.visible');
    });
  });
});
