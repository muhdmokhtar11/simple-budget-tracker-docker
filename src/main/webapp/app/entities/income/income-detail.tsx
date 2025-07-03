import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { TextFormat } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './income.reducer';

export const IncomeDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const incomeEntity = useAppSelector(state => state.income.entity);
  const loading = useAppSelector(state => state.income.loading);
  const error = useAppSelector(state => state.income.errorMessage);

  return (
    <div data-testid="income-detail-page">
      <Row>
        <Col md="8" data-testid="income-detail-content">
          <h2 data-cy="incomeDetailsHeading" data-testid="heading-income-details">
            Income Details
          </h2>

          {loading && (
            <div className="d-flex justify-content-center p-4" data-testid="loading-income-detail">
              <span>Loading...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" data-testid="error-income-detail">
              {error}
            </div>
          )}

          {!loading && !error && incomeEntity && (
            <dl className="jh-entity-details" data-testid="income-details-list">
              <dt data-testid="label-id">
                <span id="id">ID</span>
              </dt>
              <dd data-testid="value-id">{incomeEntity.id}</dd>

              <dt data-testid="label-amount">
                <span id="amount">Amount</span>
              </dt>
              <dd data-testid="value-amount">${incomeEntity.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</dd>

              <dt data-testid="label-description">
                <span id="description">Description</span>
              </dt>
              <dd data-testid="value-description">{incomeEntity.description || '-'}</dd>

              <dt data-testid="label-date">
                <span id="date">Date</span>
              </dt>
              <dd data-testid="value-date">
                {incomeEntity.date ? <TextFormat value={incomeEntity.date} type="date" format={APP_DATE_FORMAT} /> : '-'}
              </dd>

              <dt data-testid="label-category">Category</dt>
              <dd data-testid="value-category">{incomeEntity.category ? incomeEntity.category.name : 'No category'}</dd>

              <dt data-testid="label-user">User</dt>
              <dd data-testid="value-user">{incomeEntity.user ? incomeEntity.user.login : 'No user'}</dd>
            </dl>
          )}

          <div className="d-flex gap-2 mt-3" data-testid="action-buttons">
            <Button tag={Link} to="/income" replace color="info" data-cy="entityDetailsBackButton" data-testid="btn-back-to-list">
              <FontAwesomeIcon icon="arrow-left" /> <span className="d-none d-md-inline">Back</span>
            </Button>
            {incomeEntity.id && (
              <Button tag={Link} to={`/income/${incomeEntity.id}/edit`} replace color="primary" data-testid="btn-edit-income">
                <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default IncomeDetail;
