import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Row, Col, Button, Input, Label, FormGroup, Badge, Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TextFormat } from 'react-jhipster';
import dayjs from 'dayjs';
import { APP_DATE_FORMAT } from 'app/config/constants';
import './income-summary.scss';

interface IIncomeSummaryProps {
  incomeList: any[];
  categories: any[];
  loading: boolean;
  onFilterChange: (filters: any) => void;
}

// Local storage keys for filter preferences
const FILTER_STORAGE_KEY = 'income_filter_preferences';
const VIEW_STORAGE_KEY = 'income_summary_view_preferences';

// Helper functions for localStorage
const saveFiltersToStorage = (filters: any) => {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          dateFrom: '',
          dateTo: '',
          categoryId: '',
          minAmount: '',
          maxAmount: '',
        };
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
    return {
      dateFrom: '',
      dateTo: '',
      categoryId: '',
      minAmount: '',
      maxAmount: '',
    };
  }
};

export const IncomeSummary: React.FC<IIncomeSummaryProps> = ({ incomeList, categories, loading, onFilterChange }) => {
  // Load saved filters from localStorage
  const [filters, setFilters] = useState(loadFiltersFromStorage());
  const [filteredIncomes, setFilteredIncomes] = useState(incomeList);

  // Load saved view preferences
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      return saved ? JSON.parse(saved).showFilters || false : false;
    } catch {
      return false;
    }
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate summary statistics
  const calculateSummary = (incomes: any[]) => {
    if (!incomes || incomes.length === 0) {
      return {
        totalAmount: 0,
        averageAmount: 0,
        totalCount: 0,
        currentMonthAmount: 0,
        currentMonthCount: 0,
        highestAmount: 0,
        lowestAmount: 0,
      };
    }

    const currentMonth = dayjs().startOf('month');
    const currentMonthIncomes = incomes.filter(income => dayjs(income.date).isAfter(currentMonth));

    const amounts = incomes.map(income => income.amount || 0);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageAmount = totalAmount / incomes.length;
    const currentMonthAmount = currentMonthIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    return {
      totalAmount,
      averageAmount,
      totalCount: incomes.length,
      currentMonthAmount,
      currentMonthCount: currentMonthIncomes.length,
      highestAmount: Math.max(...amounts),
      lowestAmount: Math.min(...amounts),
    };
  };

  const summary = calculateSummary(filteredIncomes);

  // Apply filters
  useEffect(() => {
    let filtered = [...incomeList];

    if (filters.dateFrom) {
      filtered = filtered.filter(
        income => dayjs(income.date).isAfter(dayjs(filters.dateFrom)) || dayjs(income.date).isSame(dayjs(filters.dateFrom)),
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        income => dayjs(income.date).isBefore(dayjs(filters.dateTo)) || dayjs(income.date).isSame(dayjs(filters.dateTo)),
      );
    }

    if (filters.categoryId) {
      filtered = filtered.filter(income => income.category?.id?.toString() === filters.categoryId);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(income => (income.amount || 0) >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(income => (income.amount || 0) <= parseFloat(filters.maxAmount));
    }

    setFilteredIncomes(filtered);
    onFilterChange(filters);
  }, [filters, incomeList, onFilterChange]);

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value,
    };
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
    setError(null);
  };

  const clearFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      categoryId: '',
      minAmount: '',
      maxAmount: '',
    };
    setFilters(emptyFilters);
    saveFiltersToStorage(emptyFilters);
    setError(null);
  };

  const toggleFilters = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);

    // Save view preferences
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify({ showFilters: newShowFilters }));
    } catch (err) {
      console.warn('Failed to save view preferences:', err);
    }
  };

  const exportData = () => {
    try {
      setError(null);
      if (filteredIncomes.length === 0) {
        setError('No data available to export. Please apply filters or add income entries.');
        return;
      }

      const exportableData = {
        exportDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        totalItems: filteredIncomes.length,
        appliedFilters: filters,
        data: filteredIncomes.map(income => ({
          id: income.id,
          amount: income.amount,
          description: income.description,
          date: income.date,
          category: income.category?.name || null,
          user: income.user?.login || null,
        })),
      };

      const dataStr = JSON.stringify(exportableData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `income-data-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    }
  };

  return (
    <div className="income-summary mb-4" data-testid="income-summary-container">
      {/* Error Alert */}
      {error && (
        <Alert color="danger" isOpen={true} toggle={() => setError(null)} className="mb-3" data-testid="alert-summary-error">
          <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-3" data-testid="summary-cards-row">
        <Col md="3" data-testid="col-total-income">
          <Card className="border-primary summary-card" data-testid="card-total-income">
            <CardBody>
              <CardTitle tag="h6" className="text-primary" data-testid="title-total-income">
                <FontAwesomeIcon icon="dollar-sign" className="me-2" data-testid="icon-total-income" />
                Total Income
              </CardTitle>
              <h3 className="text-primary mb-0" data-cy="total-income" data-testid="value-total-income">
                ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <small className="text-muted" data-testid="subtitle-total-income">
                From {summary.totalCount} entries
              </small>
            </CardBody>
          </Card>
        </Col>
        <Col md="3" data-testid="col-average-income">
          <Card className="border-success summary-card" data-testid="card-average-income">
            <CardBody>
              <CardTitle tag="h6" className="text-success" data-testid="title-average-income">
                <FontAwesomeIcon icon="chart-line" className="me-2" data-testid="icon-average-income" />
                Average Income
              </CardTitle>
              <h3 className="text-success mb-0" data-cy="average-income" data-testid="value-average-income">
                ${summary.averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <small className="text-muted" data-testid="subtitle-average-income">
                Per entry
              </small>
            </CardBody>
          </Card>
        </Col>
        <Col md="3" data-testid="col-current-month">
          <Card className="border-info summary-card" data-testid="card-current-month">
            <CardBody>
              <CardTitle tag="h6" className="text-info" data-testid="title-current-month">
                <FontAwesomeIcon icon="calendar-alt" className="me-2" data-testid="icon-current-month" />
                This Month
              </CardTitle>
              <h3 className="text-info mb-0" data-cy="current-month-income" data-testid="value-current-month">
                ${summary.currentMonthAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <small className="text-muted" data-testid="subtitle-current-month">
                {summary.currentMonthCount} entries
              </small>
            </CardBody>
          </Card>
        </Col>
        <Col md="3" data-testid="col-highest-income">
          <Card className="border-warning summary-card" data-testid="card-highest-income">
            <CardBody>
              <CardTitle tag="h6" className="text-warning" data-testid="title-highest-income">
                <FontAwesomeIcon icon="arrow-up" className="me-2" data-testid="icon-highest-income" />
                Highest Entry
              </CardTitle>
              <h3 className="text-warning mb-0" data-cy="highest-income" data-testid="value-highest-income">
                ${summary.highestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <small className="text-muted" data-testid="subtitle-highest-income">
                Lowest: ${summary.lowestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Filter Controls */}
      <Card className="mb-3 filter-card" data-testid="filter-controls-card">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3" data-testid="filter-header">
            <h6 className="mb-0" data-testid="filter-title">
              <FontAwesomeIcon icon="filter" className="me-2" data-testid="icon-filter" />
              Filters & Analytics
            </h6>
            <div className="d-flex align-items-center gap-2" data-testid="filter-actions">
              <Button
                color="outline-primary"
                size="sm"
                onClick={toggleFilters}
                data-cy="toggle-filters"
                data-testid="btn-toggle-filters"
                className="me-2"
                disabled={loading}
                aria-expanded={showFilters}
                aria-controls="filter-controls"
              >
                <FontAwesomeIcon
                  icon={showFilters ? 'eye-slash' : 'eye'}
                  className="me-1"
                  data-testid={`icon-${showFilters ? 'hide' : 'show'}-filters`}
                />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                color="outline-success"
                size="sm"
                onClick={exportData}
                data-cy="export-data"
                data-testid="btn-export-data"
                className="me-2"
                disabled={loading || filteredIncomes.length === 0}
                title={filteredIncomes.length === 0 ? 'No data to export' : 'Export filtered data'}
              >
                <FontAwesomeIcon icon="download" className="me-1" data-testid="icon-export" />
                Export Data
              </Button>
              <Badge color="info" data-cy="filtered-count" data-testid="badge-filtered-count" className="px-2 py-1">
                {filteredIncomes.length} of {incomeList.length} entries
              </Badge>
            </div>
          </div>

          {showFilters && (
            <div data-cy="filter-controls" data-testid="filter-form-container" id="filter-controls" className="mt-3 p-3 bg-light rounded">
              <Row data-testid="filter-date-row">
                <Col md="6" data-testid="col-date-from">
                  <FormGroup>
                    <Label for="dateFrom" data-testid="label-date-from">
                      Date From
                    </Label>
                    <Input
                      type="date"
                      id="dateFrom"
                      value={filters.dateFrom}
                      onChange={e => handleFilterChange('dateFrom', e.target.value)}
                      data-cy="date-from-filter"
                      data-testid="input-date-from"
                      disabled={loading}
                      aria-describedby="dateFromHelp"
                    />
                    <small id="dateFromHelp" className="form-text text-muted">
                      Filter from this date onwards
                    </small>
                  </FormGroup>
                </Col>
                <Col md="6" data-testid="col-date-to">
                  <FormGroup>
                    <Label for="dateTo" data-testid="label-date-to">
                      Date To
                    </Label>
                    <Input
                      type="date"
                      id="dateTo"
                      value={filters.dateTo}
                      onChange={e => handleFilterChange('dateTo', e.target.value)}
                      data-cy="date-to-filter"
                      data-testid="input-date-to"
                      disabled={loading}
                      aria-describedby="dateToHelp"
                    />
                    <small id="dateToHelp" className="form-text text-muted">
                      Filter up to this date
                    </small>
                  </FormGroup>
                </Col>
              </Row>
              <Row data-testid="filter-amount-category-row">
                <Col md="4" data-testid="col-category">
                  <FormGroup>
                    <Label for="categoryFilter" data-testid="label-category">
                      Category
                    </Label>
                    <Input
                      type="select"
                      id="categoryFilter"
                      value={filters.categoryId}
                      onChange={e => handleFilterChange('categoryId', e.target.value)}
                      data-cy="category-filter"
                      data-testid="select-category"
                      disabled={loading}
                      aria-describedby="categoryHelp"
                    >
                      <option value="" data-testid="option-all-categories">
                        All Categories
                      </option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id} data-testid={`option-category-${category.id}`}>
                          {category.name}
                        </option>
                      ))}
                    </Input>
                    <small id="categoryHelp" className="form-text text-muted">
                      Filter by category
                    </small>
                  </FormGroup>
                </Col>
                <Col md="4" data-testid="col-min-amount">
                  <FormGroup>
                    <Label for="minAmount" data-testid="label-min-amount">
                      Min Amount
                    </Label>
                    <Input
                      type="number"
                      id="minAmount"
                      value={filters.minAmount}
                      onChange={e => handleFilterChange('minAmount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      data-cy="min-amount-filter"
                      data-testid="input-min-amount"
                      disabled={loading}
                      aria-describedby="minAmountHelp"
                    />
                    <small id="minAmountHelp" className="form-text text-muted">
                      Minimum amount
                    </small>
                  </FormGroup>
                </Col>
                <Col md="4" data-testid="col-max-amount">
                  <FormGroup>
                    <Label for="maxAmount" data-testid="label-max-amount">
                      Max Amount
                    </Label>
                    <Input
                      type="number"
                      id="maxAmount"
                      value={filters.maxAmount}
                      onChange={e => handleFilterChange('maxAmount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      data-cy="max-amount-filter"
                      data-testid="input-max-amount"
                      disabled={loading}
                      aria-describedby="maxAmountHelp"
                    />
                    <small id="maxAmountHelp" className="form-text text-muted">
                      Maximum amount
                    </small>
                  </FormGroup>
                </Col>
              </Row>
              <Row data-testid="filter-actions-row">
                <Col md="12" className="text-end">
                  <Button
                    color="outline-secondary"
                    size="sm"
                    onClick={clearFilters}
                    data-cy="clear-filters"
                    data-testid="btn-clear-filters"
                    disabled={loading}
                    className="me-2"
                  >
                    <FontAwesomeIcon icon="times" className="me-1" data-testid="icon-clear-filters" />
                    Clear All Filters
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => onFilterChange(filters)}
                    data-testid="btn-apply-filters"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon="check" className="me-1" data-testid="icon-apply-filters" />
                    Apply Filters
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <Card className="stats-card" data-testid="quick-stats-card">
        <CardBody>
          <h6 className="mb-3" data-testid="stats-title">
            <FontAwesomeIcon icon="chart-bar" className="me-2" data-testid="icon-stats" />
            Quick Statistics
          </h6>
          <Row data-testid="stats-row">
            <Col md="3" data-testid="col-stat-total-entries">
              <div className="text-center stat-item" data-testid="stat-total-entries">
                <div className="h4 text-primary" data-cy="stat-total-entries" data-testid="value-total-entries">
                  {summary.totalCount}
                </div>
                <small className="text-muted" data-testid="label-total-entries">
                  Total Entries
                </small>
              </div>
            </Col>
            <Col md="3" data-testid="col-stat-avg-monthly">
              <div className="text-center stat-item" data-testid="stat-avg-monthly">
                <div className="h4 text-success" data-cy="stat-avg-monthly" data-testid="value-avg-monthly">
                  ${(summary.totalAmount / 12).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <small className="text-muted" data-testid="label-avg-monthly">
                  Avg Monthly
                </small>
              </div>
            </Col>
            <Col md="3" data-testid="col-stat-entries-this-month">
              <div className="text-center stat-item" data-testid="stat-entries-this-month">
                <div className="h4 text-info" data-cy="stat-entries-this-month" data-testid="value-entries-this-month">
                  {summary.currentMonthCount}
                </div>
                <small className="text-muted" data-testid="label-entries-this-month">
                  This Month
                </small>
              </div>
            </Col>
            <Col md="3" data-testid="col-stat-range">
              <div className="text-center stat-item" data-testid="stat-range">
                <div className="h4 text-warning" data-cy="stat-range" data-testid="value-range">
                  ${(summary.highestAmount - summary.lowestAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <small className="text-muted" data-testid="label-range">
                  Range
                </small>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </div>
  );
};

export default IncomeSummary;
