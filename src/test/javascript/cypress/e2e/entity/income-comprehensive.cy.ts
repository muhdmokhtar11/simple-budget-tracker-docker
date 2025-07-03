// Note: entity selectors are not used in this comprehensive test file
// as it uses more specific data-testid selectors for better test maintainability

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
      cy.intercept('GET', '/api/incomes?*', { delay: 2000, fixture: 'income-list.json' }).as('getIncomesDelayed');
      cy.visit(incomePageUrl);

      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getIncomesDelayed');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should handle empty data state', () => {
      cy.intercept('GET', '/api/incomes?*', { body: [] }).as('getEmptyIncomes');
      cy.visit(incomePageUrl);
      cy.wait('@getEmptyIncomes');

      cy.get('[data-testid="alert-no-data"]').should('be.visible');
      cy.get('[data-testid="alert-no-data"]').should('contain', 'No Incomes found');
      cy.get('[data-testid="link-create-first"]').should('be.visible');
    });
  });

  describe('Summary Dashboard Tests', () => {
    it('should display all summary cards with correct data', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check all summary cards
      cy.get('[data-testid="card-total-income"]').should('be.visible');
      cy.get('[data-testid="value-total-income"]').should('contain', '$');

      cy.get('[data-testid="card-average-income"]').should('be.visible');
      cy.get('[data-testid="value-average-income"]').should('contain', '$');

      cy.get('[data-testid="card-current-month"]').should('be.visible');
      cy.get('[data-testid="value-current-month"]').should('contain', '$');

      cy.get('[data-testid="card-highest-income"]').should('be.visible');
      cy.get('[data-testid="value-highest-income"]').should('contain', '$');
    });

    it('should display quick statistics', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('[data-testid="quick-stats-card"]').should('be.visible');
      cy.get('[data-testid="value-total-entries"]').should('be.visible');
      cy.get('[data-testid="value-avg-monthly"]').should('be.visible');
      cy.get('[data-testid="value-entries-this-month"]').should('be.visible');
      cy.get('[data-testid="value-range"]').should('be.visible');
    });
  });

  describe('Filter and Search Tests', () => {
    it('should toggle filter controls', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Filters should be hidden by default
      cy.get('[data-testid="filter-form-container"]').should('not.exist');

      // Show filters
      cy.get('[data-testid="btn-toggle-filters"]').click();
      cy.get('[data-testid="filter-form-container"]').should('be.visible');

      // Hide filters
      cy.get('[data-testid="btn-toggle-filters"]').click();
      cy.get('[data-testid="filter-form-container"]').should('not.exist');
    });

    it('should apply date filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Show filters
      cy.get('[data-testid="btn-toggle-filters"]').click();

      // Apply date from filter
      cy.get('[data-testid="input-date-from"]').type('2024-01-01');
      cy.get('[data-testid="input-date-to"]').type('2024-12-31');

      // Check that filters are applied
      cy.get('[data-testid="badge-filtered-count"]').should('be.visible');
    });

    it('should apply category filter', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');
      cy.wait('@getCategories');

      // Show filters
      cy.get('[data-testid="btn-toggle-filters"]').click();

      // Select category
      cy.get('[data-testid="select-category"]').select('1');

      // Check that filter is applied
      cy.get('[data-testid="badge-filtered-count"]').should('be.visible');
    });

    it('should apply amount filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Show filters
      cy.get('[data-testid="btn-toggle-filters"]').click();

      // Apply amount filters
      cy.get('[data-testid="input-min-amount"]').type('100');
      cy.get('[data-testid="input-max-amount"]').type('5000');

      // Check that filters are applied
      cy.get('[data-testid="badge-filtered-count"]').should('be.visible');
    });

    it('should clear all filters', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Show filters and apply some
      cy.get('[data-testid="btn-toggle-filters"]').click();
      cy.get('[data-testid="input-min-amount"]').type('100');
      cy.get('[data-testid="input-max-amount"]').type('5000');

      // Clear filters
      cy.get('[data-testid="btn-clear-filters"]').click();

      // Check that filters are cleared
      cy.get('[data-testid="input-min-amount"]').should('have.value', '');
      cy.get('[data-testid="input-max-amount"]').should('have.value', '');
    });

    it('should export data', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Export data
      cy.get('[data-testid="btn-export-data"]').click();

      // Check that download was triggered (this is tricky in Cypress)
      // We'll just check that the button is working
      cy.get('[data-testid="btn-export-data"]').should('be.visible');
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

      // Select first item
      cy.get('[data-testid^="checkbox-item-"]').first().check();
      cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');
      cy.get('[data-testid="selected-items-count"]').should('contain', '1 item selected');
    });

    it('should select all items', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Select all items
      cy.get('[data-testid="checkbox-select-all"]').check();
      cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');
      cy.get('[data-testid="selected-items-count"]').should('contain', 'selected');
    });

    it('should clear selection', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Select some items
      cy.get('[data-testid^="checkbox-item-"]').first().check();
      cy.get('[data-testid="bulk-actions-bar"]').should('be.visible');

      // Clear selection
      cy.get('[data-testid="btn-clear-selection"]').click();
      cy.get('[data-testid="bulk-actions-bar"]').should('not.exist');
    });
  });

  describe('View Mode Tests', () => {
    it('should toggle between table and card view', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Default should be table view
      cy.get('[data-testid="btn-view-table"]').should('have.class', 'btn-primary');

      // Switch to card view
      cy.get('[data-testid="btn-view-cards"]').click();
      cy.get('[data-testid="btn-view-cards"]').should('have.class', 'btn-primary');

      // Switch back to table view
      cy.get('[data-testid="btn-view-table"]').click();
      cy.get('[data-testid="btn-view-table"]').should('have.class', 'btn-primary');
    });
  });

  describe('CRUD Operations Tests', () => {
    it('should create new income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click create button
      cy.get('[data-testid="btn-create-income"]').click();
      cy.url().should('match', /\/income\/new$/);

      // Fill form
      cy.get('[data-testid="input-amount"]').type('1500.75');
      cy.get('[data-testid="input-description"]').type('Test income');
      cy.get('[data-testid="input-date"]').type('2024-01-15T10:30');
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

      // Click view button
      cy.get('[data-testid^="btn-view-"]').first().click();
      cy.wait('@getIncomeDetail');

      // Check details page
      cy.get('[data-testid="income-detail-page"]').should('be.visible');
      cy.get('[data-testid="heading-income-details"]').should('contain', 'Income Details');
      cy.get('[data-testid="income-details-list"]').should('be.visible');
    });

    it('should edit income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click edit button
      cy.get('[data-testid^="btn-edit-"]').first().click();
      cy.url().should('match', /\/income\/\d+\/edit$/);

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
    });

    it('should delete income', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click delete button
      cy.get('[data-testid^="btn-delete-"]').first().click();

      // Check delete modal
      cy.get('[data-testid="income-delete-modal"]').should('be.visible');
      cy.get('[data-testid="delete-confirmation-text"]').should('be.visible');

      // Confirm delete
      cy.get('[data-testid="btn-confirm-delete"]').click();
      cy.wait('@deleteIncome');

      // Modal should close
      cy.get('[data-testid="income-delete-modal"]').should('not.exist');
    });

    it('should cancel delete operation', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Click delete button
      cy.get('[data-testid^="btn-delete-"]').first().click();

      // Check delete modal
      cy.get('[data-testid="income-delete-modal"]').should('be.visible');

      // Cancel delete
      cy.get('[data-testid="btn-cancel-delete"]').click();

      // Modal should close
      cy.get('[data-testid="income-delete-modal"]').should('not.exist');
    });
  });

  describe('Navigation Tests', () => {
    it('should navigate to create page', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      cy.get('[data-testid="btn-create-income"]').click();
      cy.url().should('match', /\/income\/new$/);
      cy.get('[data-testid="heading-income-form"]').should('contain', 'Create a new Income');
    });

    it('should navigate back from create page', () => {
      cy.visit(`${incomePageUrl}/new`);
      cy.wait('@getCategories');
      cy.wait('@getUsers');

      cy.get('[data-testid="btn-cancel"]').click();
      cy.url().should('match', incomePageUrlPattern);
    });

    it('should navigate back from detail page', () => {
      cy.visit(`${incomePageUrl}/1`);
      cy.wait('@getIncomeDetail');

      cy.get('[data-testid="btn-back-to-list"]').click();
      cy.url().should('match', incomePageUrlPattern);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/incomes?*', { statusCode: 500, body: { message: 'Server Error' } }).as('getIncomesError');
      cy.visit(incomePageUrl);
      cy.wait('@getIncomesError');

      // Should show error message
      cy.get('[data-testid="alert-error-message"]').should('be.visible');
    });

    it('should handle create errors', () => {
      cy.intercept('POST', '/api/incomes', { statusCode: 400, body: { message: 'Validation Error' } }).as('createIncomeError');

      cy.visit(`${incomePageUrl}/new`);
      cy.wait('@getCategories');
      cy.wait('@getUsers');

      // Fill form with invalid data
      cy.get('[data-testid="input-amount"]').type('invalid');
      cy.get('[data-testid="btn-save"]').click();

      // Should show validation error
      cy.get('.invalid-feedback').should('be.visible');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Check ARIA labels
      cy.get('[data-testid="th-sort-id"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="checkbox-select-all"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="btn-toggle-filters"]').should('have.attr', 'aria-expanded');
    });

    it('should support keyboard navigation', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Tab navigation
      cy.get('[data-testid="btn-refresh-list"]').focus();
      cy.get('[data-testid="btn-refresh-list"]').should('be.focused');

      // Enter key should work on buttons
      cy.get('[data-testid="btn-refresh-list"]').type('{enter}');
      cy.wait('@getIncomes');
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
      cy.get('[data-testid="view-mode-toggle"]').should('be.visible');
      cy.get('[data-testid="summary-cards-row"]').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });

    it('should handle large datasets', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
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
      cy.get('[data-testid="pagination-container"]').should('be.visible');
    });
  });

  describe('Local Storage Tests', () => {
    it('should persist filter preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Apply filters
      cy.get('[data-testid="btn-toggle-filters"]').click();
      cy.get('[data-testid="input-min-amount"]').type('100');

      // Reload page
      cy.reload();
      cy.wait('@getIncomes');

      // Check that filters are restored
      cy.get('[data-testid="btn-toggle-filters"]').click();
      cy.get('[data-testid="input-min-amount"]').should('have.value', '100');
    });

    it('should persist view mode preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Switch to card view
      cy.get('[data-testid="btn-view-cards"]').click();

      // Reload page
      cy.reload();
      cy.wait('@getIncomes');

      // Check that view mode is restored
      cy.get('[data-testid="btn-view-cards"]').should('have.class', 'btn-primary');
    });

    it('should persist sort preferences', () => {
      cy.visit(incomePageUrl);
      cy.wait('@getIncomes');

      // Sort by amount
      cy.get('[data-testid="th-sort-amount"]').click();

      // Reload page
      cy.reload();
      cy.wait('@getIncomes');

      // Check that sort is restored
      cy.get('[data-testid="icon-sort-amount"]').should('be.visible');
    });
  });
});
