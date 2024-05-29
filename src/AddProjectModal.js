import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 8px;
  }
`;

const AddProjectModal = ({ show, handleClose, handleAddProject }) => {
  const [projectName, setProjectName] = useState('');

  const onSubmit = () => {
    handleAddProject(projectName);
    setProjectName('');
    handleClose();
  };

  return (
    <StyledModal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Add Project
        </Button>
      </Modal.Footer>
    </StyledModal>
  );
};

export default AddProjectModal;
