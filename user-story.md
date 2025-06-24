**Title**: Add Income and Expenses to Budget Planner

**As a** User of the budget planner webapp
**I want** to be able to add income and expenses, categorizing them with user-defined categories
**So that** I can accurately track my financial inflows and outflows and understand where my money is coming from and going to.

**Business Logic**:

- Each income/expense entry must have an amount (positive for income, negative for expense).
- User-defined categories must be saved and available for future income/expense entries.
- The application should prevent the user from entering non-numeric values for the amount.

**Acceptance Criteria**:

1. I can successfully add an income entry with a specified amount and a user-defined category.
2. I can successfully add an expense entry with a specified amount and a user-defined category.
3. The categories I create are saved and available for selection when adding future income or expenses.
4. The application displays an error message if I try to enter non-numeric characters in the amount field.
5. The application displays an error message if I try to submit an income/expense without specifying an amount.

**Functional Requirements**:

- Ability to add a new income entry with fields for: Amount, Category (user-defined), and optional Description.
- Ability to add a new expense entry with fields for: Amount, Category (user-defined), and optional Description.
- A mechanism to create and save new categories for income and expenses.
- A dropdown or similar UI element to select from existing categories when adding income or expenses.
- Validation to ensure the amount field contains only numeric values.

**Non-Functional Requirements**:

- The application should be responsive and accessible on different screen sizes.
- The application should load quickly and provide a smooth user experience.
- Data should be stored securely.

**UI Design**:

- A clear and intuitive form for adding income and expenses.
- A dropdown menu or similar UI element for selecting categories.
- Visual cues to differentiate between income and expense entries (e.g., different colors).
- Clear error messages displayed near the relevant input field.
