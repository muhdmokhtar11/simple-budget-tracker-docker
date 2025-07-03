import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Table, Alert, Spinner } from 'reactstrap';
import { JhiItemCount, JhiPagination, TextFormat, getPaginationState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './income.reducer';
import { getEntities as getCategories } from 'app/entities/category/category.reducer';
import IncomeSummary from './income-summary';

// Local storage keys for user preferences
const STORAGE_KEYS = {
  INCOME_VIEW_PREFERENCES: 'income_view_preferences',
  INCOME_SORT_PREFERENCES: 'income_sort_preferences',
  INCOME_FILTER_PREFERENCES: 'income_filter_preferences',
};

// Helper functions for localStorage
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const Income = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  // Load saved preferences from localStorage
  const savedSortPreferences = loadFromLocalStorage(STORAGE_KEYS.INCOME_SORT_PREFERENCES, {
    sort: 'id',
    order: 'asc',
  });

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(
      { ...getPaginationState(pageLocation, ITEMS_PER_PAGE, savedSortPreferences.sort), order: savedSortPreferences.order },
      pageLocation.search,
    ),
  );

  // Local state management
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(loadFromLocalStorage(STORAGE_KEYS.INCOME_VIEW_PREFERENCES, 'table'));
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const incomeList = useAppSelector(state => state.income.entities);
  const loading = useAppSelector(state => state.income.loading);
  const totalItems = useAppSelector(state => state.income.totalItems);
  const categories = useAppSelector(state => state.category.entities);
  const errorMessage = useAppSelector(state => state.income.errorMessage);

  const getAllEntities = () => {
    try {
      setError(null);
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }),
      );
    } catch (err) {
      setError('Failed to load income data. Please try again.');
    }
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
    dispatch(getCategories({}));
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
    const newOrder = paginationState.order === ASC ? DESC : ASC;
    const newPaginationState = {
      ...paginationState,
      order: newOrder,
      sort: p,
    };

    // Save sort preferences to localStorage
    saveToLocalStorage(STORAGE_KEYS.INCOME_SORT_PREFERENCES, {
      sort: p,
      order: newOrder,
    });

    setPaginationState(newPaginationState);
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    setError(null);
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

  const handleFilterChange = (filters: any) => {
    // Save filter preferences to localStorage
    saveToLocalStorage(STORAGE_KEYS.INCOME_FILTER_PREFERENCES, filters);
    setError(null);
  };

  // View mode toggle
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
    saveToLocalStorage(STORAGE_KEYS.INCOME_VIEW_PREFERENCES, mode);
  };

  // Bulk actions
  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev => (prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]));
  };

  const handleSelectAll = () => {
    if (selectedItems.length === incomeList.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(incomeList.map(item => item.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      setShowBulkActions(true);
    }
  };

  // Error handling
  const dismissError = () => {
    setError(null);
  };

  return (
    <div data-testid="income-page-container">
      {/* Error Alert */}
      {(error || errorMessage) && (
        <Alert color="danger" isOpen={true} toggle={dismissError} data-testid="alert-error-message">
          <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
          {error || errorMessage}
        </Alert>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-3" data-testid="page-header">
        <h2 id="income-heading" data-cy="IncomeHeading" data-testid="heading-incomes">
          Incomes
        </h2>
        <div className="d-flex align-items-center gap-2">
          {/* View Mode Toggle */}
          <div className="btn-group" role="group" data-testid="view-mode-toggle">
            <Button
              color={viewMode === 'table' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              data-testid="btn-view-table"
            >
              <FontAwesomeIcon icon="table" />
            </Button>
            <Button
              color={viewMode === 'cards' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleViewModeChange('cards')}
              data-testid="btn-view-cards"
            >
              <FontAwesomeIcon icon="th" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            className="me-2"
            color="info"
            onClick={handleSyncList}
            disabled={loading}
            data-testid="btn-refresh-list"
            data-cy="refreshButton"
          >
            <FontAwesomeIcon icon="sync" spin={loading} />
            {loading ? ' Loading...' : ' Refresh list'}
          </Button>
          <Link
            to="/income/new"
            className="btn btn-primary jh-create-entity"
            id="jh-create-entity"
            data-cy="entityCreateButton"
            data-testid="btn-create-income"
          >
            <FontAwesomeIcon icon="plus" />
            &nbsp; Create a new Income
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded" data-testid="bulk-actions-bar">
          <span data-testid="selected-items-count">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <div>
            <Button color="danger" size="sm" onClick={handleBulkDelete} data-testid="btn-bulk-delete">
              <FontAwesomeIcon icon="trash" /> Delete Selected
            </Button>
            <Button color="secondary" size="sm" className="ms-2" onClick={() => setSelectedItems([])} data-testid="btn-clear-selection">
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Income Summary Dashboard */}
      <IncomeSummary
        incomeList={incomeList}
        categories={categories}
        loading={loading}
        onFilterChange={handleFilterChange}
        data-testid="income-summary-component"
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="d-flex justify-content-center p-4" data-testid="loading-spinner">
          <Spinner color="primary" />
          <span className="ms-2">Loading income data...</span>
        </div>
      )}

      {/* Data Table/Cards Container */}
      <div className="table-responsive" data-testid="income-data-container">
        {incomeList && incomeList.length > 0 ? (
          <Table responsive data-testid="income-table">
            <thead data-testid="table-header">
              <tr>
                <th data-testid="th-select-all">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === incomeList.length && incomeList.length > 0}
                    onChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                    aria-label="Select all items"
                  />
                </th>
                <th className="hand" onClick={sort('id')} data-testid="th-sort-id" aria-label="Sort by ID">
                  ID <FontAwesomeIcon icon={getSortIconByFieldName('id')} data-testid="icon-sort-id" />
                </th>
                <th className="hand" onClick={sort('amount')} data-testid="th-sort-amount" aria-label="Sort by Amount">
                  Amount <FontAwesomeIcon icon={getSortIconByFieldName('amount')} data-testid="icon-sort-amount" />
                </th>
                <th className="hand" onClick={sort('description')} data-testid="th-sort-description" aria-label="Sort by Description">
                  Description <FontAwesomeIcon icon={getSortIconByFieldName('description')} data-testid="icon-sort-description" />
                </th>
                <th className="hand" onClick={sort('date')} data-testid="th-sort-date" aria-label="Sort by Date">
                  Date <FontAwesomeIcon icon={getSortIconByFieldName('date')} data-testid="icon-sort-date" />
                </th>
                <th data-testid="th-category">
                  Category <FontAwesomeIcon icon="sort" data-testid="icon-category" />
                </th>
                <th data-testid="th-user">
                  User <FontAwesomeIcon icon="sort" data-testid="icon-user" />
                </th>
                <th data-testid="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody data-testid="table-body">
              {incomeList.map((income, i) => (
                <tr
                  key={`entity-${i}`}
                  data-cy="entityTable"
                  data-testid={`table-row-${income.id}`}
                  className={selectedItems.includes(income.id) ? 'table-active' : ''}
                >
                  <td data-testid={`cell-checkbox-${income.id}`}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(income.id)}
                      onChange={() => handleSelectItem(income.id)}
                      data-testid={`checkbox-item-${income.id}`}
                      aria-label={`Select income ${income.id}`}
                    />
                  </td>
                  <td data-testid={`cell-id-${income.id}`}>
                    <Button tag={Link} to={`/income/${income.id}`} color="link" size="sm" data-testid={`link-id-${income.id}`}>
                      {income.id}
                    </Button>
                  </td>
                  <td data-testid={`cell-amount-${income.id}`}>
                    <span data-testid={`text-amount-${income.id}`}>
                      ${income.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </span>
                  </td>
                  <td data-testid={`cell-description-${income.id}`}>
                    <span data-testid={`text-description-${income.id}`}>{income.description || '-'}</span>
                  </td>
                  <td data-testid={`cell-date-${income.id}`}>
                    <span data-testid={`text-date-${income.id}`}>
                      {income.date ? <TextFormat type="date" value={income.date} format={APP_DATE_FORMAT} /> : '-'}
                    </span>
                  </td>
                  <td data-testid={`cell-category-${income.id}`}>
                    {income.category ? (
                      <Link to={`/category/${income.category.id}`} data-testid={`link-category-${income.id}`}>
                        {income.category.name}
                      </Link>
                    ) : (
                      <span data-testid={`text-no-category-${income.id}`}>-</span>
                    )}
                  </td>
                  <td data-testid={`cell-user-${income.id}`}>
                    <span data-testid={`text-user-${income.id}`}>{income.user ? income.user.login : '-'}</span>
                  </td>
                  <td className="text-end" data-testid={`cell-actions-${income.id}`}>
                    <div className="btn-group flex-btn-group-container" data-testid={`actions-group-${income.id}`}>
                      <Button
                        tag={Link}
                        to={`/income/${income.id}`}
                        color="info"
                        size="sm"
                        data-cy="entityDetailsButton"
                        data-testid={`btn-view-${income.id}`}
                        title={`View income ${income.id}`}
                      >
                        <FontAwesomeIcon icon="eye" /> <span className="d-none d-md-inline">View</span>
                      </Button>
                      <Button
                        tag={Link}
                        to={`/income/${income.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        color="primary"
                        size="sm"
                        data-cy="entityEditButton"
                        data-testid={`btn-edit-${income.id}`}
                        title={`Edit income ${income.id}`}
                      >
                        <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() =>
                          (window.location.href = `/income/${income.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
                        }
                        color="danger"
                        size="sm"
                        data-cy="entityDeleteButton"
                        data-testid={`btn-delete-${income.id}`}
                        title={`Delete income ${income.id}`}
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
          !loading && (
            <div className="alert alert-warning" data-testid="alert-no-data" data-cy="noDataAlert">
              <FontAwesomeIcon icon="info-circle" className="me-2" />
              No Incomes found.{' '}
              <Link to="/income/new" data-testid="link-create-first">
                Create your first income entry
              </Link>
              .
            </div>
          )
        )}
      </div>
      {/* Pagination */}
      {totalItems ? (
        <div className={incomeList && incomeList.length > 0 ? 'mt-4' : 'd-none'} data-testid="pagination-container">
          <div className="justify-content-center d-flex mb-2" data-testid="pagination-info">
            <JhiItemCount
              page={paginationState.activePage}
              total={totalItems}
              itemsPerPage={paginationState.itemsPerPage}
              data-testid="pagination-count"
            />
          </div>
          <div className="justify-content-center d-flex" data-testid="pagination-controls">
            <JhiPagination
              activePage={paginationState.activePage}
              onSelect={handlePagination}
              maxButtons={5}
              itemsPerPage={paginationState.itemsPerPage}
              totalItems={totalItems}
              data-testid="pagination-component"
            />
          </div>
        </div>
      ) : (
        !loading &&
        incomeList &&
        incomeList.length === 0 && (
          <div className="text-center mt-4" data-testid="no-pagination">
            <small className="text-muted">No pagination needed</small>
          </div>
        )
      )}
    </div>
  );
};

export default Income;
