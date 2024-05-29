// src/ProjectList.js
import React from 'react';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 5px;
  background-color: ${({ active }) => (active ? '#007bff' : 'white')};
  color: ${({ active }) => (active ? 'white' : 'black')};
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: ${({ active }) => (active ? '#0056b3' : '#f8f9fa')};
  }
`;

const DeleteButton = styled.button`
  background-color: #dc3545;
  border: none;
  color: white;
  padding: 8px 16px;
  margin-left: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;

  &:hover {
    background-color: #c82333;
    z-index: 2;
    transform: scale(1.2);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ProjectList = ({ projects, selectedProject, selectProject, deleteProject }) => {
  console.log('projects', projects);
  return (
    <div>
      {projects.map((project, index) => (
        <ListItem key={index} active={project === selectedProject} onClick={() => selectProject(project)}>
          <span style={{ flexGrow: 1 }}>{project}</span>
          <DeleteButton onClick={(e) => { e.stopPropagation(); deleteProject(index); }}>
            &times;
          </DeleteButton>
        </ListItem>
      ))}
    </div>
  );
};

export default ProjectList;
