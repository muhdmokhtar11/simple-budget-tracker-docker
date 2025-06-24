import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Dashboard from 'app/modules/dashboard/dashboard';
import Category from './category';
import Income from './income';
import Expense from './expense';
/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="category/*" element={<Category />} />
        <Route path="income/*" element={<Income />} />
        <Route path="expense/*" element={<Expense />} />
        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
