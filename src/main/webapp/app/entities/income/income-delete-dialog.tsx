import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntity, getEntity } from './income.reducer';

export const IncomeDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const pageLocation = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const incomeEntity = useAppSelector(state => state.income.entity);
  const updateSuccess = useAppSelector(state => state.income.updateSuccess);
  const loading = useAppSelector(state => state.income.loading);
  const deleting = useAppSelector(state => state.income.updating);

  const handleClose = () => {
    navigate(`/income${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(incomeEntity.id));
  };

  return (
    <Modal isOpen toggle={handleClose} data-testid="income-delete-modal" backdrop="static" keyboard={false}>
      <ModalHeader toggle={handleClose} data-cy="incomeDeleteDialogHeading" data-testid="modal-header-delete">
        <FontAwesomeIcon icon="exclamation-triangle" className="text-danger me-2" />
        Confirm delete operation
      </ModalHeader>
      <ModalBody id="simpleBudgetTrackerApp.income.delete.question" data-testid="modal-body-delete">
        {loading ? (
          <div data-testid="loading-delete-modal">Loading income details...</div>
        ) : (
          <div data-testid="delete-confirmation-text">
            Are you sure you want to delete Income <strong>#{incomeEntity.id}</strong>?
            {incomeEntity.description && (
              <div className="mt-2">
                <small className="text-muted">Description: {incomeEntity.description}</small>
              </div>
            )}
            {incomeEntity.amount && (
              <div className="mt-1">
                <small className="text-muted">Amount: ${incomeEntity.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</small>
              </div>
            )}
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-danger">
                <FontAwesomeIcon icon="warning" className="me-1" />
                This action cannot be undone.
              </small>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter data-testid="modal-footer-delete">
        <Button color="secondary" onClick={handleClose} disabled={deleting} data-testid="btn-cancel-delete">
          <FontAwesomeIcon icon="ban" />
          &nbsp; Cancel
        </Button>
        <Button
          id="jhi-confirm-delete-income"
          data-cy="entityConfirmDeleteButton"
          data-testid="btn-confirm-delete"
          color="danger"
          onClick={confirmDelete}
          disabled={deleting || loading}
        >
          <FontAwesomeIcon icon="trash" />
          &nbsp; {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default IncomeDeleteDialog;
