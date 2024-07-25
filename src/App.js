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
  fetchTabs,
  getCurrentWindow,
  getFromLocalStorage,
  removeCarryOverTab,
  addCarryOverTab,
  removeTab
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
    let window = await getCurrentWindow();
    console.log('windowId', window.id);
    const selectedProjectKey = `selectedProject_${window.id}`;
    const result = await getFromLocalStorageMultiple([
      'projects', 'projectTabs', selectedProjectKey, 'eventLogs',
      'carryOverTabs'    ]);
    console.log(result);
    if (result.projects) setProjects(result.projects);
    if (result.projectTabs) setProjectTabs(result.projectTabs);
    if (result[selectedProjectKey]){
      // remove window id
      let selectProject = result[selectedProjectKey];
      selectProject = selectProject.split('_')[0];
      setSelectedProject(selectProject);
    }
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
      await setToLocalStorage({ projectToOpen: newProject });
      const currentWindow = await getCurrentWindow();
      
      await removeFromLocalStorageMultiple([
        'selectedProject', 
        `selectedProject_${currentWindow.id}`
      ]);
  
      const isMaximized = currentWindow.state === 'maximized';
      const newWindowOptions = {
        width: isMaximized ? undefined : currentWindow.width,
        height: isMaximized ? undefined : currentWindow.height,
        state: isMaximized ? 'maximized' : 'normal'
      };
  
      const newWindow = await new Promise((resolve) => {
        chrome.windows.create(newWindowOptions, resolve);
      });
  
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const tabs = await fetchTabs({ windowId: currentWindow.id });
      const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
      
      const tabsToMove = [];
      const tabsToRemove = [];
      const carryOverUrls = new Map();
  
      tabs.forEach(tab => {
        if (carryOverTabs[tab.id]) {
          tabsToMove.push(tab.id);
          carryOverUrls.set(tab.url, tab.id);
        } else {
          tabsToRemove.push(tab.id);
        }
      });
  
      if (tabsToMove.length > 0) {
        const movedTabs = await new Promise((resolve) => {
          chrome.tabs.move(tabsToMove, { windowId: newWindow.id, index: -1 }, (result) => {
            // Ensure result is always an array
            resolve(Array.isArray(result) ? result : [result]);
          });
        });
  
        // Update carryOverTabs with new tab IDs
        const updatedCarryOverTabs = {};
        for (const movedTab of movedTabs) {
          if (carryOverUrls.has(movedTab.url)) {
            const oldTabId = carryOverUrls.get(movedTab.url);
            updatedCarryOverTabs[movedTab.id] = movedTab.url;
            await removeCarryOverTab(oldTabId);
          }
        }
  
        // Add new carry-over tabs
        for (const [tabId, url] of Object.entries(updatedCarryOverTabs)) {
          await addCarryOverTab({ id: parseInt(tabId), url });
        }
      }
      console.log('tabsToRemove', tabsToRemove);
      if (tabsToRemove.length > 0) {
        await Promise.all(tabsToRemove.map(tabId => removeTab(tabId)));
      }
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
