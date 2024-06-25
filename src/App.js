/* global chrome */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';
import ProjectList from './ProjectList';
import AddProjectModal from './AddProjectModal';
import ConfirmationModal from './ConfirmationModal';
import { getFromStorage, removeFromStorage, setToStorage } from './utils/storage';

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

  const initializeState = () => {
    // Fetch the current window ID
    chrome.windows.getCurrent({}, async (currentWindow) => {
      const windowId = (await chrome.windows.getCurrent()).id;
      console.log('windowId', windowId);
      const selectedProjectKey = `selectedProject_${windowId}`;

      // Fetch the necessary data from storage, including the dynamic selectedProject key
      getFromStorage(['projects', 'projectTabs', selectedProjectKey, 'eventLogs'], (result) => {
        console.log('result', result);

        // Set the state based on the fetched data
        if (result.projects) setProjects(result.projects);
        if (result.projectTabs) setProjectTabs(result.projectTabs);

        // Use the window-specific selectedProject key to set the selected project
        if (result[selectedProjectKey]) setSelectedProject(result[selectedProjectKey]);
      });
    });
  };

  const saveTabs = (projectName) => {
    console.log('saveTabs', projectName);
    chrome.tabs.query({}, (tabs) => {
      console.log('tabs', tabs);
      const tabUrls = tabs.map(tab => tab.url);
      const updatedProjectTabs = { ...projectTabs, [projectName]: tabUrls };
      setProjectTabs(updatedProjectTabs);
      setToStorage({ projectTabs: updatedProjectTabs });
    });
  };

  const openTabs = (tabUrls, newWindow) => {
    if (newWindow) {
      chrome.windows.create({ url: tabUrls });
    } else {
      chrome.tabs.query({}, (tabs) => {
        const tabIds = tabs.map(tab => tab.id);
        chrome.tabs.remove(tabIds, () => {
          tabUrls.forEach(url => {
            chrome.tabs.create({ url });
          });
        });
      });
    }
  };


  const getCurrentWindow = () => {
    return new Promise((resolve, reject) => {
      chrome.windows.getCurrent((window) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(window);
        }
      });
    });
  };


  const deleteAssociation = (projectName) => {
    const updatedProjectTabs = { ...projectTabs };
    delete updatedProjectTabs[projectName];
    setProjectTabs(updatedProjectTabs);
    setToStorage({ projectTabs: updatedProjectTabs });
  };

  const addProject = async (projectName) => {
    if (projectName && !projects.includes(projectName)) {
      const newProjects = [...projects, projectName];
      const currentWindow = await getCurrentWindow();
      const windowId = currentWindow.id;
      const selectedProjectKey = `selectedProject_${windowId}`;
      if (projects.length === 0 || selectedProject === null) {
        console.log('addProject', projectName);
        setProjects(newProjects);
        saveTabs(projectName);
        setSelectedProject(projectName);
        setToStorage({ projects: newProjects, [selectedProjectKey]: projectName });
      } else {
        setToStorage({ projects: newProjects, });
        setProjects(newProjects);
        pendingProjectSelection.current = projectName;
        setConfirmationAction('selectProject');
        setShowConfirmation(true);
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

  const confirmSwitchToProject = async (openNewWindow) => {
    console.log('confirmSwitchToProject please' + String(openNewWindow));
    const newProject = pendingProjectSelection.current;
    if (openNewWindow) {
      chrome.storage.local.set({ projectToOpen: newProject }, () => {
        // Get the current window
        chrome.windows.getCurrent(function (currentWindow) {
          removeFromStorage(
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
                const tabIdsToRemove = tabs.map(tab => tab.id);
                chrome.tabs.remove(tabIdsToRemove, () => { });
              });
            }, 1000);
          });
        });
      });
    } else {
      openTabs(projectTabs[newProject], false);
      setSelectedProject(newProject);
      setToStorage({ selectedProject: newProject });
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
    setToStorage({ projects: newProjects });
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
