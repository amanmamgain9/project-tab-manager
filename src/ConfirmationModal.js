import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmationModal = ({ show, handleClose, handleConfirmation, confirmationAction }) => {
  const handleOpenNewWindow = () => {
    handleConfirmation(true);
  };

  const handleStayInSameWindow = () => {
    handleConfirmation(false);
  };

  const getMessage = () => {
    if (confirmationAction === 'addProject') {
      return 'Do you want to add the project without switching to it?';
    } else if (confirmationAction === 'selectProject') {
      return 'Are you sure you want to switch to the new project?';
    } else {
      return 'Are you sure?';
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{getMessage()}</p>
      </Modal.Body>
      <Modal.Footer>
        {confirmationAction === 'selectProject' ? (
          <>
            <Button variant="secondary" onClick={()=>{handleConfirmation(false)}}>
              Stay with this project
            </Button>
            <Button variant="primary" onClick={()=>{handleConfirmation(true)}}>
              Switch Project
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={handleConfirmation}>
            Confirm
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
