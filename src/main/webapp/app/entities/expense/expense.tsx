import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Table, Card, CardBody, CardTitle, Row, Col, FormGroup, Label, Input, Badge } from 'reactstrap';
import { JhiItemCount, JhiPagination, TextFormat, getPaginationState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortDown, faSortUp, faDownload, faFilter, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './expense.reducer';

export const Expense = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );

  // New state for features
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  const expenseList = useAppSelector(state => state.expense.entities);
  const loading = useAppSelector(state => state.expense.loading);
  const totalItems = useAppSelector(state => state.expense.totalItems);

  // Calculate expense summary - ensure expenseList is an array
  const totalExpenses = (expenseList || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const averageExpense = (expenseList || []).length > 0 ? totalExpenses / expenseList.length : 0;
  const highestExpense = (expenseList || []).reduce((max, expense) => Math.max(max, expense.amount || 0), 0);

  // Filter expenses based on amount range
  const filteredExpenses = (expenseList || []).filter(expense => {
    const amount = expense.amount || 0;
    const min = minAmount === '' ? -Infinity : Number(minAmount);
    const max = maxAmount === '' ? Infinity : Number(maxAmount);
    return amount >= min && amount <= max;
  });

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }),
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (pageLocation.search !== endURL) {
      navigate(`${pageLocation.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  useEffect(() => {
    const params = new URLSearchParams(pageLocation.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [pageLocation.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  const getSortIconByFieldName = (fieldName: string) => {
    const sortFieldName = paginationState.sort;
    const order = paginationState.order;
    if (sortFieldName !== fieldName) {
      return faSort;
    }
    return order === ASC ? faSortUp : faSortDown;
  };

  // New feature functions
  const handleSelectExpense = (expenseId: number) => {
    setSelectedExpenses(prev => (prev.includes(expenseId) ? prev.filter(id => id !== expenseId) : [...prev, expenseId]));
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(expense => expense.id || 0));
    }
  };

  const exportSelectedExpenses = () => {
    const selectedExpenseData = (expenseList || []).filter(expense => selectedExpenses.includes(expense.id || 0));

    const csvContent = [
      'ID,Amount,Description,Date,Category',
      ...selectedExpenseData.map(
        expense =>
          `${expense.id},${expense.amount},"${expense.description || ''}","${expense.date || ''}","${expense.category?.name || ''}"`,
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <div>
      <h2 id="expense-heading" data-cy="ExpenseHeading">
        Expenses
        <div className="d-flex justify-content-end">
          <Button className="me-2" color="secondary" onClick={() => setShowQuickActions(!showQuickActions)} data-cy="quickActionsToggle">
            <FontAwesomeIcon icon={showQuickActions ? 'times' : 'bars'} />
            &nbsp; Quick Actions
          </Button>
          <Button className="me-2" color="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} /> Refresh list
          </Button>
          <Link to="/expense/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp; Create a new Expense
          </Link>
        </div>
      </h2>

      {/* Quick Actions Section */}
      {showQuickActions && (
        <div className="mb-4" data-cy="quickActionsSection">
          <Row>
            {/* Expense Summary Cards */}
            <Col md="4">
              <Card className="mb-3" data-cy="expenseSummaryCard">
                <CardBody>
                  <CardTitle tag="h6">
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Expense Summary
                  </CardTitle>
                  <div className="d-flex justify-content-between">
                    <span>Total:</span>
                    <Badge color="primary" data-cy="totalExpensesBadge">
                      ${totalExpenses.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Average:</span>
                    <Badge color="info" data-cy="averageExpenseBadge">
                      ${averageExpense.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Highest:</span>
                    <Badge color="success" data-cy="highestExpenseBadge">
                      ${highestExpense.toFixed(2)}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Quick Filter */}
            <Col md="4">
              <Card className="mb-3" data-cy="quickFilterCard">
                <CardBody>
                  <CardTitle tag="h6">
                    <FontAwesomeIcon icon={faFilter} className="me-2" />
                    Quick Filter
                  </CardTitle>
                  <FormGroup>
                    <Label for="minAmount">Min Amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={minAmount}
                      onChange={e => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      data-cy="minAmountInput"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="maxAmount">Max Amount</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={maxAmount}
                      onChange={e => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      data-cy="maxAmountInput"
                    />
                  </FormGroup>
                  <Button color="secondary" size="sm" onClick={clearFilters} data-cy="clearFiltersButton">
                    Clear Filters
                  </Button>
                </CardBody>
              </Card>
            </Col>

            {/* Bulk Export */}
            <Col md="4">
              <Card className="mb-3" data-cy="bulkExportCard">
                <CardBody>
                  <CardTitle tag="h6">
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Bulk Export
                  </CardTitle>
                  <p className="small text-muted">Selected: {selectedExpenses.length} expenses</p>
                  <Button
                    color="success"
                    size="sm"
                    onClick={exportSelectedExpenses}
                    disabled={selectedExpenses.length === 0}
                    data-cy="exportSelectedButton"
                  >
                    <FontAwesomeIcon icon="download" />
                    &nbsp; Export Selected
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      <div className="table-responsive">
        {filteredExpenses && filteredExpenses.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th>
                  <Input
                    type="checkbox"
                    checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                    onChange={handleSelectAll}
                    data-cy="selectAllCheckbox"
                  />
                </th>
                <th className="hand" onClick={sort('id')}>
                  ID <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('amount')}>
                  Amount <FontAwesomeIcon icon={getSortIconByFieldName('amount')} />
                </th>
                <th className="hand" onClick={sort('description')}>
                  Description <FontAwesomeIcon icon={getSortIconByFieldName('description')} />
                </th>
                <th className="hand" onClick={sort('date')}>
                  Date <FontAwesomeIcon icon={getSortIconByFieldName('date')} />
                </th>
                <th>
                  Category <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  User <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, i) => (
                <tr key={`entity-${i}`} data-cy="entityTable">
                  <td>
                    <Input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id || 0)}
                      onChange={() => handleSelectExpense(expense.id || 0)}
                      data-cy={`expenseCheckbox-${expense.id}`}
                    />
                  </td>
                  <td>
                    <Button tag={Link} to={`/expense/${expense.id}`} color="link" size="sm">
                      {expense.id}
                    </Button>
                  </td>
                  <td data-cy={`expenseAmount-${expense.id}`}>{expense.amount}</td>
                  <td data-cy={`expenseDescription-${expense.id}`}>{expense.description}</td>
                  <td>{expense.date ? <TextFormat type="date" value={expense.date} format={APP_DATE_FORMAT} /> : null}</td>
                  <td>{expense.category ? <Link to={`/category/${expense.category.id}`}>{expense.category.name}</Link> : ''}</td>
                  <td>{expense.user ? expense.user.login : ''}</td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button tag={Link} to={`/expense/${expense.id}`} color="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" /> <span className="d-none d-md-inline">View</span>
                      </Button>
                      <Button
                        tag={Link}
                        to={`/expense/${expense.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        color="primary"
                        size="sm"
                        data-cy="entityEditButton"
                      >
                        <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() =>
                          (window.location.href = `/expense/${expense.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
                        }
                        color="danger"
                        size="sm"
                        data-cy="entityDeleteButton"
                      >
                        <FontAwesomeIcon icon="trash" /> <span className="d-none d-md-inline">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          !loading && <div className="alert alert-warning">No Expenses found</div>
        )}
      </div>
      {totalItems ? (
        <div className={filteredExpenses && filteredExpenses.length > 0 ? '' : 'd-none'}>
          <div className="justify-content-center d-flex">
            <JhiItemCount page={paginationState.activePage} total={totalItems} itemsPerPage={paginationState.itemsPerPage} />
          </div>
          <div className="justify-content-center d-flex">
            <JhiPagination
              activePage={paginationState.activePage}
              onSelect={handlePagination}
              maxButtons={5}
              itemsPerPage={paginationState.itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default Expense;
