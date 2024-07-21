/* global chrome */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';
import ProjectList from './ProjectList';
import AddProjectModal from './AddProjectModal';
import ConfirmationModal from './ConfirmationModal';
import { 
  getFromLocalStorageMultiple, 
  removeFromLocalStorageMultiple, 
  setToLocalStorage,
  fetchTabs
} from './utils/chromeUtils';

const Container = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
`;

const AddButton = styled.button`
  background-color: #007bff;
  border: none;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const App = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTabs, setProjectTabs] = useState({});
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const pendingProjectSelection = useRef(null);

  useEffect(() => {
    initializeState();
  }, []);

  const initializeState = async () => {
      const selectedProjectKey = 'selectedProject';
      const result = await getFromLocalStorageMultiple(['projects', 'projectTabs', selectedProjectKey, 'eventLogs']);
      console.log(result);
      if (result.projects) setProjects(result.projects);
      if (result.projectTabs) setProjectTabs(result.projectTabs);
      if (result[selectedProjectKey]) setSelectedProject(result[selectedProjectKey]);
  };

  const saveTabs = async (projectName) => {
      const tabs = await fetchTabs({});
      const tabUrls = tabs.map(tab => tab.url);
      const updatedProjectTabs = { ...projectTabs, [projectName]: tabUrls };
      setProjectTabs(updatedProjectTabs);
      await setToLocalStorage({ projectTabs: updatedProjectTabs });
  };

  const deleteAssociation = (projectName) => {
    const updatedProjectTabs = { ...projectTabs };
    delete updatedProjectTabs[projectName];
    setProjectTabs(updatedProjectTabs);
    setToLocalStorage({ projectTabs: updatedProjectTabs });
  };

  const addProject = async (projectName) => {
    if (projectName && !projects.includes(projectName)) {
      const newProjects = [...projects, projectName];
      const selectedProjectKey = `selectedProject`;
      if (selectedProject === null) {
        setProjects(newProjects);
        saveTabs(projectName);
        setSelectedProject(projectName);
        setToLocalStorage({ 
          projects: newProjects, 
          [selectedProjectKey]: projectName 
        });
      } else {
        setProjects(newProjects);
        pendingProjectSelection.current = projectName;
        setConfirmationAction('selectProject');
        setShowConfirmation(true);
        setToLocalStorage({ projects: newProjects, });
      }
    }
  };

  const switchToProject = (projectName) => {
    if (projectName !== selectedProject) {
      pendingProjectSelection.current = projectName;
      setConfirmationAction('selectProject');
      setShowConfirmation(true);
    }
  };

  const confirmSwitchToProject = async (switchProjectBool) => {
    const newProject = pendingProjectSelection.current;
    
    if (switchProjectBool) {
      chrome.storage.local.set({ projectToOpen: newProject }, () => {
        // Get the current window
        alert('Switching to project: ' + newProject);
        chrome.windows.getCurrent(function (currentWindow) {
          removeFromLocalStorageMultiple(
            ['selectedProject', 'selectedProject_' + currentWindow.id]);
          // Get the dimensions of the current window
          let width = currentWindow.width;
          let height = currentWindow.height;
          let isMaximized = currentWindow.state === 'maximized';
          
          // Create a new window with the same dimensions
          chrome.windows.create({
            width: isMaximized ? undefined : currentWindow.width,
            height: isMaximized ? undefined : currentWindow.height,
            state: isMaximized ? 'maximized' : 'normal'
          }, (newWindow) => {
            setTimeout(() => {
              // Query all tabs in the old window
              chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
                let carryOverTabs = localStorage.getItem('carryOverTabs');
                const tabIdsToRemove = tabs.map(tab => tab.id);
                chrome.tabs.remove(tabIdsToRemove, () => { });
              });
            }, 1000);
          });
        });
      });
    }
    setShowConfirmation(false);
    pendingProjectSelection.current = null;
  };

  const deleteProject = (index) => {
    const projectName = projects[index];
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    if (projectName === selectedProject) {
      setSelectedProject(null);
    }
    deleteAssociation(projectName);
    setToLocalStorage({ projects: newProjects });
  };

  const handleAddProject = () => {
    setShowAddProjectModal(true);
  };

  const handleAddProjectSubmit = (projectName) => {
    addProject(projectName);
    setShowAddProjectModal(false);
  };

  const handleConfirmation = (switchProject) => {
    if (switchProject === false) {
      setShowConfirmation(false);
    } else if (switchProject === true) {
      confirmSwitchToProject(switchProject);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Projects</Title>
        <AddButton onClick={handleAddProject}>
          <span className="add-icon">+</span>
        </AddButton>
      </Header>
      <ProjectList
        projects={projects}
        selectedProject={selectedProject}
        selectProject={switchToProject}
        deleteProject={deleteProject}
      />
      <AddProjectModal
        show={showAddProjectModal}
        handleClose={() => setShowAddProjectModal(false)}
        handleAddProject={handleAddProjectSubmit}
      />
      <ConfirmationModal
        show={showConfirmation}
        handleClose={() => setShowConfirmation(false)}
        handleConfirmation={handleConfirmation}
        confirmationAction={confirmationAction}
      />
    </Container>
  );
};

export default App;
