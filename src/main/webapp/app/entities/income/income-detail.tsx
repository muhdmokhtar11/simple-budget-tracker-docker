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
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="incomeDetailsHeading">Income</h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">ID</span>
          </dt>
          <dd>{incomeEntity.id}</dd>
          <dt>
            <span id="amount">Amount</span>
          </dt>
          <dd>{incomeEntity.amount}</dd>
          <dt>
            <span id="description">Description</span>
          </dt>
          <dd>{incomeEntity.description}</dd>
          <dt>
            <span id="date">Date</span>
          </dt>
          <dd>{incomeEntity.date ? <TextFormat value={incomeEntity.date} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>Category</dt>
          <dd>{incomeEntity.category ? incomeEntity.category.name : ''}</dd>
          <dt>User</dt>
          <dd>{incomeEntity.user ? incomeEntity.user.login : ''}</dd>
        </dl>
        <Button tag={Link} to="/income" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" /> <span className="d-none d-md-inline">Back</span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/income/${incomeEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
        </Button>
      </Col>
    </Row>
  );
};

export default IncomeDetail;
