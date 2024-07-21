// /* global chrome */
import { logEvent, processLogQueue } from './log.js';
import { handleWindowTabs, updateProjectTabs } from './tab.js';
import {
  setupContextMenu, handleContextMenuClick,
  removeCarryOverTab, updateCarryOverTab,
  updateContextMenu
} from './carryover.js';
import { getFromLocalStorage,removeFromLocalStorage, fetchTabs, createTab, 
  setToLocalStorage, removeTab,clearInactiveSelectedProjects
} from './chromeUtils.js';



// Initialize event listeners
chrome.runtime.onInstalled.addListener(() => {
  logEvent('Extension installed or updated');
  chrome.storage.local.set({ initialized: true });
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  logEvent('Browser started up');
});

chrome.windows.onCreated.addListener(async (window) => {
  await clearInactiveSelectedProjects();
  const windowId = window.id;
  let selectedProjectKey = `selectedProject_${windowId}`;
  const tabs = await fetchTabs({ windowId });
  const newTabId = tabs[0].id;
  logEvent(`Window ${windowId} created with ${tabs.length} tabs`);
  const projectToOpen = await getFromLocalStorage('projectToOpen');
  logEvent(`Project to open: ${projectToOpen}`);
  setToLocalStorage({ [`selectedProject`]: projectToOpen });
  if (projectToOpen) {
    const projectName = projectToOpen;
    let projectTabs  = await getFromLocalStorage('projectTabs');

    let tabUrls = [];
    if (projectTabs && projectTabs[projectName]) {
      tabUrls = projectTabs[projectName];
    } else {
      projectTabs = { ...projectTabs, [projectName]: [] };
      await setToLocalStorage({ projectTabs });
    }

    // Create new tabs
    await Promise.all(tabUrls.map(url => createTab({ url, windowId })));

    // Set selected project and remove projectToOpen
    await setToLocalStorage({ [`selectedProject_${window.id}`]: projectName });
    await removeFromLocalStorage('projectToOpen');

    // Check if we need to remove the initial new tab
    const updatedTabs = await fetchTabs({ windowId });
    if (updatedTabs.length !== 1) {
      await removeTab(newTabId);
    }
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.local.remove([`selectedProject_${windowId}`], () => {
    chrome.runtime.sendMessage({ action: 'clearSelectedProject' }, (response) => { });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setNewWindowProject') {
    chrome.storage.local.set({ projectToOpen: message.project }, () => {
      sendResponse({ status: 'success' });
    });
    return true;
  } else if (message.action === 'clearSelectedProject') {
    chrome.storage.local.remove('selectedProject', () => {
      sendResponse({ status: 'success' });
    });
    return true;
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  updateProjectTabs('tabs.onCreated');
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // removeCarryOverTab(tabId);
  updateProjectTabs('tabs.onRemoved');
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  updateProjectTabs('tabs.onDetached');
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  updateProjectTabs('tabs.onAttached');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // updateCarryOverTab(tabId, changeInfo);
  updateProjectTabs('tabs.onUpdated');
});


chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Update context menu when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateContextMenu(tab);
  });
});

// Update context menu when a tab is highlighted
chrome.tabs.onHighlighted.addListener((highlightInfo) => {
  const tabId = highlightInfo.tabIds[0]; // Assuming single selection
  chrome.tabs.get(tabId, (tab) => {
    updateContextMenu(tab);
  });
});
