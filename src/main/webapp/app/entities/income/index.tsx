import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Income from './income';
import IncomeDetail from './income-detail';
import IncomeUpdate from './income-update';
import IncomeDeleteDialog from './income-delete-dialog';

const IncomeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Income />} />
    <Route path="new" element={<IncomeUpdate />} />
    <Route path=":id">
      <Route index element={<IncomeDetail />} />
      <Route path="edit" element={<IncomeUpdate />} />
      <Route path="delete" element={<IncomeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default IncomeRoutes;
