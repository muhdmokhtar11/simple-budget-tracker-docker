import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Expense from './expense';
import ExpenseDetail from './expense-detail';
import ExpenseUpdate from './expense-update';
import ExpenseDeleteDialog from './expense-delete-dialog';

const ExpenseRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Expense />} />
    <Route path="new" element={<ExpenseUpdate />} />
    <Route path=":id">
      <Route index element={<ExpenseDetail />} />
      <Route path="edit" element={<ExpenseUpdate />} />
      <Route path="delete" element={<ExpenseDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ExpenseRoutes;
