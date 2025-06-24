import './home.scss';

import React from 'react';
import { Link } from 'react-router-dom';

import { Alert, Col, Row, Card, CardBody, Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faChartLine, faUsers, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

import { useAppSelector } from 'app/config/store';
import Dashboard from '../dashboard/dashboard';

export const Home = () => {
  const account = useAppSelector(state => state.authentication.account);

  if (account?.login) {
    return <Dashboard />;
  }

  return (
    <div className="home-container">
      <Row className="hero-section">
        <Col lg={6} className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <FontAwesomeIcon icon={faWallet} className="me-3" />
              Simple Budget Tracker
            </h1>
            <p className="hero-subtitle">
              Take control of your finances with our intuitive budget tracking application. Monitor your income, track expenses, and
              visualize your financial journey.
            </p>
            <div className="hero-actions">
              <Button color="primary" size="lg" tag={Link} to="/login" className="me-3">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Sign In
              </Button>
              <Button color="outline-primary" size="lg" tag={Link} to="/account/register">
                Get Started Free
              </Button>
            </div>
          </div>
        </Col>
        <Col lg={6} className="hero-visual">
          <div className="hero-image">
            <div className="budget-preview">
              <div className="preview-card income-preview">
                <FontAwesomeIcon icon={faChartLine} />
                <span>Track Income</span>
              </div>
              <div className="preview-card expense-preview">
                <FontAwesomeIcon icon={faWallet} />
                <span>Monitor Expenses</span>
              </div>
              <div className="preview-card analytics-preview">
                <FontAwesomeIcon icon={faChartLine} />
                <span>View Analytics</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="features-section">
        <Col lg={12}>
          <h2 className="features-title">Why Choose Simple Budget Tracker?</h2>
          <Row className="features-grid">
            <Col lg={4} md={6} className="mb-4">
              <Card className="feature-card">
                <CardBody>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faWallet} />
                  </div>
                  <h4>Easy Expense Tracking</h4>
                  <p>Quickly add and categorize your expenses with our intuitive interface. Never lose track of where your money goes.</p>
                </CardBody>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="feature-card">
                <CardBody>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <h4>Visual Analytics</h4>
                  <p>Beautiful charts and graphs help you understand your spending patterns and financial trends at a glance.</p>
                </CardBody>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="feature-card">
                <CardBody>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faShieldAlt} />
                  </div>
                  <h4>Secure & Private</h4>
                  <p>Your financial data is protected with enterprise-grade security. Only you have access to your information.</p>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row className="login-section">
        <Col lg={8} className="mx-auto">
          <Alert color="info" className="login-alert">
            <h5>Ready to get started?</h5>
            <p className="mb-3">Sign in with your account or create a new one to begin tracking your budget.</p>
            <div className="login-info">
              <strong>Demo Accounts:</strong>
              <br />
              • Administrator: login=&quot;admin&quot;, password=&quot;admin&quot;
              <br />• User: login=&quot;user&quot;, password=&quot;user&quot;
            </div>
            <div className="mt-3">
              <Button color="primary" tag={Link} to="/login" className="me-2">
                Sign In
              </Button>
              <Button color="outline-primary" tag={Link} to="/account/register">
                Create Account
              </Button>
            </div>
          </Alert>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
