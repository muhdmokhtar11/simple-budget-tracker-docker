import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { TextFormat } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './expense.reducer';

export const ExpenseDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const expenseEntity = useAppSelector(state => state.expense.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="expenseDetailsHeading">Expense</h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">ID</span>
          </dt>
          <dd>{expenseEntity.id}</dd>
          <dt>
            <span id="amount">Amount</span>
          </dt>
          <dd>{expenseEntity.amount}</dd>
          <dt>
            <span id="description">Description</span>
          </dt>
          <dd>{expenseEntity.description}</dd>
          <dt>
            <span id="date">Date</span>
          </dt>
          <dd>{expenseEntity.date ? <TextFormat value={expenseEntity.date} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>Category</dt>
          <dd>{expenseEntity.category ? expenseEntity.category.name : ''}</dd>
          <dt>User</dt>
          <dd>{expenseEntity.user ? expenseEntity.user.login : ''}</dd>
        </dl>
        <Button tag={Link} to="/expense" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" /> <span className="d-none d-md-inline">Back</span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/expense/${expenseEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
        </Button>
      </Col>
    </Row>
  );
};

export default ExpenseDetail;
