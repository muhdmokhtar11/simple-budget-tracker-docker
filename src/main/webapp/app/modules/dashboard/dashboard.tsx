import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, Row, Col, Button, Table, Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faChartLine, faPlus, faArrowUp, faArrowDown, faCalendarAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import { TextFormat } from 'react-jhipster';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getIncomes } from 'app/entities/income/income.reducer';
import { getEntities as getExpenses } from 'app/entities/expense/expense.reducer';
import { getEntities as getCategories } from 'app/entities/category/category.reducer';
import { APP_DATE_FORMAT } from 'app/config/constants';
import './dashboard.scss';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const [timeframe, setTimeframe] = useState('month');

  const incomes = useAppSelector(state => state.income.entities);
  const expenses = useAppSelector(state => state.expense.entities);
  const categories = useAppSelector(state => state.category.entities);
  const loading = useAppSelector(state => state.income.loading || state.expense.loading);

  useEffect(() => {
    dispatch(getIncomes({ page: 0, size: 100 }));
    dispatch(getExpenses({ page: 0, size: 100 }));
    dispatch(getCategories({ page: 0, size: 100 }));
  }, [dispatch]);

  const totalIncome = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  // Group expenses by category for pie chart
  const expensesByCategory = categories
    .map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category?.id === category.id);
      const total = categoryExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
      return {
        name: category.name || 'Unknown',
        value: total,
        count: categoryExpenses.length,
      };
    })
    .filter(item => item.value > 0);

  // Recent transactions (combined income and expenses)
  const recentTransactions = [
    ...incomes.map(income => ({ ...income, type: 'income' })),
    ...expenses.map(expense => ({ ...expense, type: 'expense' })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Monthly trend data (simplified)
  const monthlyData = [
    { month: 'Jan', income: 3000, expenses: 2200 },
    { month: 'Feb', income: 3200, expenses: 2400 },
    { month: 'Mar', income: 2800, expenses: 2100 },
    { month: 'Apr', income: 3500, expenses: 2600 },
    { month: 'May', income: 3300, expenses: 2300 },
    { month: 'Jun', income: totalIncome, expenses: totalExpenses },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FontAwesomeIcon icon={faWallet} className="me-2" />
          Budget Dashboard
        </h1>
        <div className="dashboard-actions">
          <Button color="success" tag={Link} to="/income/new" className="me-2">
            <FontAwesomeIcon icon={faPlus} /> Add Income
          </Button>
          <Button color="danger" tag={Link} to="/expense/new">
            <FontAwesomeIcon icon={faPlus} /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="dashboard-summary">
        <Col lg={3} md={6} className="mb-4">
          <Card className="summary-card income-card">
            <CardBody>
              <div className="summary-content">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faArrowUp} />
                </div>
                <div className="summary-details">
                  <h3 className="summary-amount">${totalIncome.toFixed(2)}</h3>
                  <p className="summary-label">Total Income</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="summary-card expense-card">
            <CardBody>
              <div className="summary-content">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faArrowDown} />
                </div>
                <div className="summary-details">
                  <h3 className="summary-amount">${totalExpenses.toFixed(2)}</h3>
                  <p className="summary-label">Total Expenses</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className={`summary-card ${netBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
            <CardBody>
              <div className="summary-content">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faWallet} />
                </div>
                <div className="summary-details">
                  <h3 className="summary-amount">${netBalance.toFixed(2)}</h3>
                  <p className="summary-label">Net Balance</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="summary-card transactions-card">
            <CardBody>
              <div className="summary-content">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="summary-details">
                  <h3 className="summary-amount">{incomes.length + expenses.length}</h3>
                  <p className="summary-label">Total Transactions</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="dashboard-charts">
        <Col lg={8} className="mb-4">
          <Card className="chart-card">
            <CardBody>
              <CardTitle tag="h5">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Monthly Trend
              </CardTitle>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={value => [`$${value}`, '']} />
                    <Line type="monotone" dataKey="income" stroke="#28a745" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="#dc3545" strokeWidth={2} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4} className="mb-4">
          <Card className="chart-card">
            <CardBody>
              <CardTitle tag="h5">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Expenses by Category
              </CardTitle>
              <div className="chart-container">
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => [`$${value}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">
                    <p>No expense data available</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Row>
        <Col lg={12}>
          <Card className="transactions-card">
            <CardBody>
              <CardTitle tag="h5">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Recent Transactions
              </CardTitle>
              {recentTransactions.length > 0 ? (
                <Table responsive className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          <TextFormat type="date" value={transaction.date} format={APP_DATE_FORMAT} />
                        </td>
                        <td>{transaction.description || 'No description'}</td>
                        <td>{transaction.category?.name || 'Uncategorized'}</td>
                        <td>
                          <Badge color={transaction.type === 'income' ? 'success' : 'danger'}>
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </td>
                        <td className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount || 0).toFixed(2)}
                        </td>
                        <td>
                          <Button tag={Link} to={`/${transaction.type}/${transaction.id}`} color="info" size="sm">
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="no-transactions">
                  <p>No recent transactions found.</p>
                  <div className="mt-3">
                    <Button color="success" tag={Link} to="/income/new" className="me-2">
                      Add Your First Income
                    </Button>
                    <Button color="danger" tag={Link} to="/expense/new">
                      Add Your First Expense
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
