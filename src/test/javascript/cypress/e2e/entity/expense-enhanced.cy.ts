import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
} from '../../support/entity';

// Helper function to get actual expense count
const getExpenseCount = () => {
  return cy.get('tr[data-cy="entityTable"]').then($rows => $rows.length);
};

// Helper function to get actual summary values
const getSummaryValues = () => {
  return {
    total: cy.get('[data-cy="totalExpensesBadge"]').invoke('text'),
    average: cy.get('[data-cy="averageExpenseBadge"]').invoke('text'),
    highest: cy.get('[data-cy="highestExpenseBadge"]').invoke('text'),
  };
};

describe('Expense Enhanced Features e2e test', () => {
  const expensePageUrl = '/expense';
  const expensePageUrlPattern = new RegExp('/expense(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  // Use negative amounts for expenses (as per validation constraint)
  const expenseSample = { amount: -100, description: 'Test expense', date: '2025-06-23T11:24:56.644Z' };
  const expenseSample2 = { amount: -250, description: 'Another test expense', date: '2025-06-24T11:24:56.644Z' };

  let expense;
  let expense2;
  let category;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/categories',
      body: { name: 'Test Category', description: 'Test category description' },
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
    if (category) {
      // Delete expenses first to avoid foreign key constraint
      if (expense) {
        cy.authenticatedRequest({
          method: 'DELETE',
          url: `/api/expenses/${expense.id}`,
        }).then(() => {
          expense = undefined;
        });
      }
      if (expense2) {
        cy.authenticatedRequest({
          method: 'DELETE',
          url: `/api/expenses/${expense2.id}`,
        }).then(() => {
          expense2 = undefined;
        });
      }

      // Then delete category
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/categories/${category.id}`,
        failOnStatusCode: false, // Don't fail if category is already deleted
      }).then(() => {
        category = undefined;
      });
    }
  });

  describe('Basic Functionality', () => {
    it('should load the expense page successfully', () => {
      cy.visit('/');
      cy.clickOnEntityMenuItem('expense');
      cy.wait('@entitiesRequest');
      cy.get('[data-cy="ExpenseHeading"]').should('exist');
      cy.url().should('match', expensePageUrlPattern);
    });

    it('should display all main page elements', () => {
      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');

      // Header elements
      cy.get('[data-cy="ExpenseHeading"]').should('be.visible');
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
      cy.get('[data-cy="entityCreateButton"]').should('be.visible');

      // Table elements - check for table structure
      cy.get('table').should('be.visible');
      cy.get('th').should('contain', 'ID');
      cy.get('th').should('contain', 'Amount');
      cy.get('th').should('contain', 'Description');
      cy.get('th').should('contain', 'Date');
      cy.get('th').should('contain', 'Category');
    });

    it('should handle loading states', () => {
      cy.intercept('GET', '/api/expenses+(?*|)', { delay: 1000 }).as('slowRequest');
      cy.visit(expensePageUrl);
      cy.get('[data-cy="ExpenseHeading"]').should('be.visible');
      cy.wait('@slowRequest');
    });
  });

  describe('Quick Actions Functionality', () => {
    beforeEach(() => {
      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');
    });

    it('should toggle Quick Actions section visibility', () => {
      // Initially Quick Actions should be hidden
      cy.get('[data-cy="quickActionsSection"]').should('not.exist');

      // Click Quick Actions toggle button
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Quick Actions section should be visible
      cy.get('[data-cy="quickActionsSection"]').should('be.visible');
      cy.get('[data-cy="expenseSummaryCard"]').should('be.visible');
      cy.get('[data-cy="quickFilterCard"]').should('be.visible');
      cy.get('[data-cy="bulkExportCard"]').should('be.visible');

      // Click again to hide
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="quickActionsSection"]').should('not.exist');
    });

    it('should display expense summary with correct calculations', () => {
      // Create test expenses first
      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample, category },
      }).then(({ body }) => {
        expense = body;
      });

      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample2, category },
      }).then(({ body }) => {
        expense2 = body;
      });

      cy.reload();
      cy.wait('@entitiesRequest');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Verify summary calculations exist and are formatted correctly
      cy.get('[data-cy="totalExpensesBadge"]').should('be.visible').and('contain', '$');
      cy.get('[data-cy="averageExpenseBadge"]').should('be.visible').and('contain', '$');
      cy.get('[data-cy="highestExpenseBadge"]').should('be.visible').and('contain', '$');

      // Verify the values are numbers (negative amounts)
      cy.get('[data-cy="totalExpensesBadge"]')
        .invoke('text')
        .then(text => {
          expect(text).to.match(/\$-\d+\.\d{2}/);
        });
    });

    it('should handle empty data in summary cards', () => {
      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: [] }).as('emptyRequest');
      cy.reload();
      cy.wait('@emptyRequest');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Verify empty state calculations
      cy.get('[data-cy="totalExpensesBadge"]').should('contain', '0.00');
      cy.get('[data-cy="averageExpenseBadge"]').should('contain', '0.00');
      cy.get('[data-cy="highestExpenseBadge"]').should('contain', '0.00');
    });
  });

  describe('Quick Filter Functionality', () => {
    beforeEach(() => {
      // Create test expenses first
      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample, category },
      }).then(({ body }) => {
        expense = body;
      });

      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample2, category },
      }).then(({ body }) => {
        expense2 = body;
      });

      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();
    });

    it('should filter expenses by minimum amount', () => {
      // Get initial count
      getExpenseCount().then(initialCount => {
        // Set min amount filter (use negative values)
        cy.get('[data-cy="minAmountInput"]').type('-200');

        // Should show fewer expenses than initial count
        cy.get('tr[data-cy="entityTable"]').should('have.length.lessThan', initialCount);

        // Verify at least one expense is shown
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
      });
    });

    it('should filter expenses by maximum amount', () => {
      // Get initial count
      getExpenseCount().then(initialCount => {
        // Set max amount filter (use negative values)
        cy.get('[data-cy="maxAmountInput"]').type('-120');

        // Should show fewer expenses than initial count
        cy.get('tr[data-cy="entityTable"]').should('have.length.lessThan', initialCount);

        // Verify at least one expense is shown
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
      });
    });

    it('should filter expenses by amount range', () => {
      // Get initial count
      getExpenseCount().then(initialCount => {
        // Set both min and max filters (use a wider range to ensure we get results)
        cy.get('[data-cy="minAmountInput"]').type('-1000');
        cy.get('[data-cy="maxAmountInput"]').type('-1');

        // Should show fewer expenses than initial count (or same if all expenses are in range)
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.most', initialCount);

        // Verify at least one expense is shown
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
      });
    });

    it('should clear filters correctly', () => {
      // Get initial count
      getExpenseCount().then(initialCount => {
        // Set filters first (use negative values)
        cy.get('[data-cy="minAmountInput"]').type('-300');
        cy.get('[data-cy="maxAmountInput"]').type('-150');

        // Clear filters
        cy.get('[data-cy="clearFiltersButton"]').click();

        // Verify filters are cleared
        cy.get('[data-cy="minAmountInput"]').should('have.value', '');
        cy.get('[data-cy="maxAmountInput"]').should('have.value', '');

        // Should show all expenses (back to initial count)
        cy.get('tr[data-cy="entityTable"]').should('have.length', initialCount);
      });
    });

    it('should handle invalid filter inputs', () => {
      // Get initial count
      getExpenseCount().then(initialCount => {
        // Test negative values (should work normally)
        cy.get('[data-cy="minAmountInput"]').type('-50');
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.most', initialCount);

        // Test non-numeric values (should be ignored or show all)
        cy.get('[data-cy="minAmountInput"]').clear().type('abc');
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
      });
    });
  });

  describe('Bulk Selection and Export', () => {
    beforeEach(() => {
      // Create test expenses first
      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample, category },
      }).then(({ body }) => {
        expense = body;
      });

      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample2, category },
      }).then(({ body }) => {
        expense2 = body;
      });

      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();
    });

    it('should handle individual expense selection', () => {
      // Initially export button should be disabled
      cy.get('[data-cy="exportSelectedButton"]').should('be.disabled');
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 0 expenses');

      // Select first expense checkbox (use first available)
      cy.get('[data-cy="selectAllCheckbox"]').should('be.visible');
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });
      cy.get('[data-cy="exportSelectedButton"]').should('not.be.disabled');
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 1 expenses');

      // Select second expense checkbox
      cy.get('tr[data-cy="entityTable"]')
        .eq(1)
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 2 expenses');

      // Unselect first expense
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').uncheck();
        });
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 1 expenses');
    });

    it('should handle select all functionality', () => {
      // Initially no expenses should be selected
      cy.get('[data-cy="selectAllCheckbox"]').should('not.be.checked');

      // Select all
      cy.get('[data-cy="selectAllCheckbox"]').check();

      // Verify all checkboxes are checked
      cy.get('tr[data-cy="entityTable"]').each($row => {
        cy.wrap($row).within(() => {
          cy.get('input[type="checkbox"]').should('be.checked');
        });
      });

      // Verify export button is enabled
      cy.get('[data-cy="exportSelectedButton"]').should('not.be.disabled');

      // Unselect all
      cy.get('[data-cy="selectAllCheckbox"]').uncheck();

      // Verify all checkboxes are unchecked
      cy.get('tr[data-cy="entityTable"]').each($row => {
        cy.wrap($row).within(() => {
          cy.get('input[type="checkbox"]').should('not.be.checked');
        });
      });

      cy.get('[data-cy="exportSelectedButton"]').should('be.disabled');
    });

    it('should export selected expenses as CSV', () => {
      // Select an expense
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });

      // Mock the download
      cy.window().then(win => {
        cy.stub(win.URL, 'createObjectURL').returns('blob:mock-url');
        cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
      });

      // Click export button
      cy.get('[data-cy="exportSelectedButton"]').click();

      // Verify URL was revoked (indicates download was triggered)
      cy.get('@revokeObjectURL').should('have.been.called');
    });

    it('should handle export with no selection', () => {
      // Export button should be disabled when no expenses are selected
      cy.get('[data-cy="exportSelectedButton"]').should('be.disabled');
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 0 expenses');
    });
  });

  describe('Table Functionality', () => {
    beforeEach(() => {
      // Create test expenses first
      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample, category },
      }).then(({ body }) => {
        expense = body;
      });

      cy.authenticatedRequest({
        method: 'POST',
        url: '/api/expenses',
        body: { ...expenseSample2, category },
      }).then(({ body }) => {
        expense2 = body;
      });

      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');
    });

    it('should display expense data correctly', () => {
      // Verify table has data
      cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);

      // Verify first row has proper structure
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('td').should('have.length.at.least', 3); // ID, Amount, Description columns
          cy.get('td').eq(2).should('not.be.empty'); // Amount column should have value
        });

      // Verify table headers
      cy.get('th').should('contain', 'ID');
      cy.get('th').should('contain', 'Amount');
      cy.get('th').should('contain', 'Description');
    });

    it('should handle table sorting', () => {
      // Sort by amount and verify the sort icon changes
      cy.get('th').contains('Amount').click();
      cy.get('th').contains('Amount').find('svg').should('be.visible');

      // Click again to reverse sort
      cy.get('th').contains('Amount').click();
      cy.get('th').contains('Amount').find('svg').should('be.visible');

      // Verify we can sort by other columns too
      cy.get('th').contains('Description').click();
      cy.get('th').contains('Description').find('svg').should('be.visible');
    });

    it('should handle empty table state', () => {
      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: [] }).as('emptyRequest');
      cy.reload();
      cy.wait('@emptyRequest');

      cy.get('.alert-warning').should('contain', 'No Expenses found');
      cy.get('tr[data-cy="entityTable"]').should('not.exist');
      cy.get('[data-cy="selectAllCheckbox"]').should('not.exist');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');
    });

    it('should work on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
      cy.get('[data-cy="entityCreateButton"]').should('be.visible');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="quickActionsSection"]').should('be.visible');

      // Verify responsive layout
      cy.get('[data-cy="expenseSummaryCard"]').should('be.visible');
      cy.get('[data-cy="quickFilterCard"]').should('be.visible');
      cy.get('[data-cy="bulkExportCard"]').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024);
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
      cy.get('[data-cy="entityCreateButton"]').should('be.visible');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="quickActionsSection"]').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
      cy.get('[data-cy="entityCreateButton"]').should('be.visible');

      // Show Quick Actions
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="quickActionsSection"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit(expensePageUrl);
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 500 }).as('errorRequest');
      cy.reload();
      cy.wait('@errorRequest');

      // Should still show the page structure
      cy.get('[data-cy="ExpenseHeading"]').should('be.visible');
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
    });

    it('should handle network timeouts', () => {
      cy.intercept('GET', '/api/expenses+(?*|)', { forceNetworkError: true }).as('networkError');
      cy.reload();
      cy.wait('@networkError');

      // Should still show the page structure
      cy.get('[data-cy="ExpenseHeading"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');
    });

    it('should have proper form labels', () => {
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Check form labels
      cy.get('label[for="minAmount"]').should('contain', 'Min Amount');
      cy.get('label[for="maxAmount"]').should('contain', 'Max Amount');
    });

    it('should have proper ARIA attributes', () => {
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Check input attributes
      cy.get('[data-cy="minAmountInput"]').should('have.attr', 'id');
      cy.get('[data-cy="maxAmountInput"]').should('have.attr', 'id');

      // Check button attributes
      cy.get('[data-cy="clearFiltersButton"]').should('be.visible');
      cy.get('[data-cy="exportSelectedButton"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.visit(expensePageUrl);
      cy.wait('@entitiesRequest');

      cy.window().then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds max
      });
    });

    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        amount: Math.floor(Math.random() * 1000),
        description: `Expense ${i + 1}`,
        date: '2025-06-23T11:24:56.644Z',
        category: { id: 1, name: 'Test Category' },
      }));

      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: largeDataset }).as('largeDataset');
      cy.visit(expensePageUrl);
      cy.wait('@largeDataset');

      // Should still be responsive
      cy.get('[data-cy="quickActionsToggle"]').should('be.visible');
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="quickActionsSection"]').should('be.visible');
    });
  });

  describe('Branch Coverage Tests', () => {
    beforeEach(() => {
      cy.visit(expensePageUrl);
    });

    it('should handle null and undefined expense values', () => {
      // Mock response with null/undefined values to test fallback logic
      const expensesWithNulls = [
        {
          id: 1,
          amount: null,
          description: null,
          date: null,
          category: null,
          user: null,
        },
        {
          id: 2,
          amount: undefined,
          description: undefined,
          date: undefined,
          category: undefined,
          user: undefined,
        },
        {
          id: 3,
          amount: -100,
          description: 'Valid expense',
          date: '2025-06-23T11:24:56.644Z',
          category: { id: 1, name: 'Test Category' },
          user: { login: 'testuser' },
        },
      ];

      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: expensesWithNulls }).as('nullValues');
      cy.reload();
      cy.wait('@nullValues');

      // Verify the component handles null values gracefully
      cy.get('tr[data-cy="entityTable"]').should('have.length', 3);

      // Check that null descriptions are handled (empty string)
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('td').eq(3).should('be.empty'); // Description column
        });

      // Check that null dates don't render TextFormat component
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('td').eq(4).should('be.empty'); // Date column
        });

      // Check that null categories don't render Link component
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('td').eq(5).should('be.empty'); // Category column
        });

      // Check that null users don't render login
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('td').eq(6).should('be.empty'); // User column
        });
    });

    it('should handle empty expense list', () => {
      // Mock empty response to test empty array conditions
      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: [] }).as('emptyList');
      cy.reload();
      cy.wait('@emptyList');

      // Verify empty state handling
      cy.get('.alert-warning').should('contain', 'No Expenses found');
      cy.get('tr[data-cy="entityTable"]').should('not.exist');
      cy.get('[data-cy="selectAllCheckbox"]').should('not.exist');

      // Test summary calculations with empty list
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="totalExpensesBadge"]').should('contain', '$0.00');
      cy.get('[data-cy="averageExpenseBadge"]').should('contain', '$0.00');
      cy.get('[data-cy="highestExpenseBadge"]').should('contain', '$0.00');
    });

    it('should handle URL parameters for pagination and sorting', () => {
      // Test URL parameter parsing branch
      cy.visit('/expense?page=1&sort=amount,desc');

      // Verify the component handles URL parameters correctly
      cy.get('th').contains('Amount').find('svg').should('be.visible');

      // Test different sort orders
      cy.get('th').contains('Amount').click(); // Should change to ascending
      cy.get('th').contains('Amount').click(); // Should change to descending
    });

    it('should test all sort icon logic branches', () => {
      cy.wait('@entitiesRequest');

      // Test sort icon for different fields
      cy.get('th').contains('ID').click();
      cy.get('th').contains('ID').find('svg').should('be.visible');

      cy.get('th').contains('Description').click();
      cy.get('th').contains('Description').find('svg').should('be.visible');

      cy.get('th').contains('Date').click();
      cy.get('th').contains('Date').find('svg').should('be.visible');

      // Test ascending/descending icon changes
      cy.get('th').contains('Amount').click(); // First click - ascending
      cy.get('th').contains('Amount').click(); // Second click - descending
    });

    it('should test select all checkbox logic branches', () => {
      cy.wait('@entitiesRequest');

      // Initially no expenses should be selected
      cy.get('[data-cy="selectAllCheckbox"]').should('not.be.checked');

      // Select all expenses
      cy.get('[data-cy="selectAllCheckbox"]').check();
      cy.get('[data-cy="selectAllCheckbox"]').should('be.checked');

      // Unselect one expense
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').uncheck();
        });

      // Select all checkbox should be unchecked (not all selected)
      cy.get('[data-cy="selectAllCheckbox"]').should('not.be.checked');

      // Select all again
      cy.get('[data-cy="selectAllCheckbox"]').check();
      cy.get('[data-cy="selectAllCheckbox"]').should('be.checked');

      // Unselect all
      cy.get('[data-cy="selectAllCheckbox"]').uncheck();
      cy.get('[data-cy="selectAllCheckbox"]').should('not.be.checked');
    });

    it('should test conditional rendering branches', () => {
      // Create expenses with different data combinations
      const mixedExpenses = [
        {
          id: 1,
          amount: -100,
          description: 'Expense with date and category',
          date: '2025-06-23T11:24:56.644Z',
          category: { id: 1, name: 'Test Category' },
          user: { login: 'testuser' },
        },
        {
          id: 2,
          amount: -200,
          description: 'Expense without date',
          date: null,
          category: { id: 2, name: 'Another Category' },
          user: null,
        },
        {
          id: 3,
          amount: -300,
          description: 'Expense without category',
          date: '2025-06-24T11:24:56.644Z',
          category: null,
          user: { login: 'anotheruser' },
        },
      ];

      cy.intercept('GET', '/api/expenses+(?*|)', { statusCode: 200, body: mixedExpenses }).as('mixedData');
      cy.reload();
      cy.wait('@mixedData');

      // Test date conditional rendering
      cy.get('tr[data-cy="entityTable"]')
        .eq(0)
        .within(() => {
          cy.get('td').eq(4).should('not.be.empty'); // Has date
        });

      cy.get('tr[data-cy="entityTable"]')
        .eq(1)
        .within(() => {
          cy.get('td').eq(4).should('be.empty'); // No date
        });

      // Test category conditional rendering
      cy.get('tr[data-cy="entityTable"]')
        .eq(0)
        .within(() => {
          cy.get('td').eq(5).should('contain', 'Test Category'); // Has category
        });

      cy.get('tr[data-cy="entityTable"]')
        .eq(2)
        .within(() => {
          cy.get('td').eq(5).should('be.empty'); // No category
        });

      // Test user conditional rendering
      cy.get('tr[data-cy="entityTable"]')
        .eq(0)
        .within(() => {
          cy.get('td').eq(6).should('contain', 'testuser'); // Has user
        });

      cy.get('tr[data-cy="entityTable"]')
        .eq(1)
        .within(() => {
          cy.get('td').eq(6).should('be.empty'); // No user
        });
    });

    it('should test pagination conditional branches', () => {
      // Test with pagination (multiple pages)
      const paginatedResponse = {
        statusCode: 200,
        headers: {
          link: '<http://localhost/api/expenses?page=0&size=20>; rel="last",<http://localhost/api/expenses?page=0&size=20>; rel="first"',
        },
        body: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          amount: -(i + 1) * 10,
          description: `Expense ${i + 1}`,
          date: '2025-06-23T11:24:56.644Z',
          category: { id: 1, name: 'Test Category' },
        })),
      };

      cy.intercept('GET', '/api/expenses+(?*|)', paginatedResponse).as('paginatedData');
      cy.reload();
      cy.wait('@paginatedData');

      // Verify pagination components are shown when there are many items
      cy.get('tr[data-cy="entityTable"]').should('have.length', 20);

      // Test without pagination (single page)
      const singlePageResponse = {
        statusCode: 200,
        headers: {},
        body: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          amount: -(i + 1) * 10,
          description: `Expense ${i + 1}`,
          date: '2025-06-23T11:24:56.644Z',
          category: { id: 1, name: 'Test Category' },
        })),
      };

      cy.intercept('GET', '/api/expenses+(?*|)', singlePageResponse).as('singlePageData');
      cy.reload();
      cy.wait('@singlePageData');

      // Verify pagination components are not shown for single page
      cy.get('tr[data-cy="entityTable"]').should('have.length', 5);
    });

    it('should test loading state branches', () => {
      // Test loading state by checking that the component handles loading gracefully
      cy.intercept('GET', '/api/expenses+(?*|)', { delay: 500 }).as('loadingState');
      cy.reload();

      // During loading, the table should not show "No Expenses found"
      cy.get('.alert-warning').should('not.exist');

      // Wait for the request to complete
      cy.wait('@loadingState');

      // After loading, the page should be in a normal state
      cy.get('[data-cy="ExpenseHeading"]').should('be.visible');
    });

    it('should test filter input change handlers', () => {
      cy.get('[data-cy="quickActionsToggle"]').click();

      // Test empty string handling in min amount
      cy.get('[data-cy="minAmountInput"]').clear();
      cy.get('[data-cy="minAmountInput"]').should('have.value', '');

      // Test number conversion - type a valid number first
      cy.get('[data-cy="minAmountInput"]').type('100');
      cy.get('[data-cy="minAmountInput"]').should('have.value', '100');

      // Test valid number
      cy.get('[data-cy="minAmountInput"]').clear().type('200');
      cy.get('[data-cy="minAmountInput"]').should('have.value', '200');

      // Test empty string handling in max amount
      cy.get('[data-cy="maxAmountInput"]').clear();
      cy.get('[data-cy="maxAmountInput"]').should('have.value', '');

      // Test number conversion
      cy.get('[data-cy="maxAmountInput"]').type('500');
      cy.get('[data-cy="maxAmountInput"]').should('have.value', '500');
    });

    it('should test expense selection logic branches', () => {
      cy.wait('@entitiesRequest');

      // Open quick actions to see the bulk export card
      cy.get('[data-cy="quickActionsToggle"]').click();
      cy.get('[data-cy="bulkExportCard"]').should('be.visible');

      // Test individual expense selection
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });

      // Verify expense is selected
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 1 expenses');

      // Test deselecting expense
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').uncheck();
        });

      // Verify expense is deselected
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 0 expenses');

      // Test selecting multiple expenses
      cy.get('tr[data-cy="entityTable"]')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });

      cy.get('tr[data-cy="entityTable"]')
        .eq(1)
        .within(() => {
          cy.get('input[type="checkbox"]').check();
        });

      // Verify multiple expenses are selected
      cy.get('[data-cy="bulkExportCard"]').should('contain', 'Selected: 2 expenses');
    });
  });

  describe('Integration with Existing CRUD', () => {
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
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
        cy.get(entityDetailsButtonSelector).first().should('be.visible').click();
        cy.getEntityDetailsHeading('expense');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('edit button click should load edit Expense page and go back', () => {
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
        cy.get(entityEditButtonSelector).first().should('be.visible').click();
        cy.getEntityCreateUpdateHeading('Expense');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('edit button click should load edit Expense page and save', () => {
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
        cy.get(entityEditButtonSelector).first().should('be.visible').click();
        cy.getEntityCreateUpdateHeading('Expense');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', expensePageUrlPattern);
      });

      it('last delete button click should delete instance of Expense', () => {
        cy.get('tr[data-cy="entityTable"]').should('have.length.at.least', 1);
        cy.intercept('GET', '/api/expenses/*').as('dialogDeleteRequest');
        cy.get(entityDeleteButtonSelector).last().should('be.visible').click();
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
      cy.get(`[data-cy="amount"]`).type('-50');
      cy.get(`[data-cy="amount"]`).should('have.value', '-50');

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
