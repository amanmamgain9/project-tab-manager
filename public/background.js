// Import functions from other modules
import { logEvent, processLogQueue } from './log.js';
import { fetchTabs, handleWindowTabs, clearAllSelectedProjectsExceptOpenWindows, updateProjectTabs } from './tab.js';
import { setupContextMenu, handleContextMenuClick,
         removeCarryOverTab, updateCarryOverTab,
         updateContextMenu
} from './carryover.js';

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
    let windowId = window.id;
    clearAllSelectedProjectsExceptOpenWindows();
    const tabs = await fetchTabs({ windowId });
    if (tabs.length === 1) {
    let newTabId = tabs[0].id;
    chrome.storage.local.get('projectToOpen', (result) => {
      if (result.projectToOpen) {
        const projectName = result.projectToOpen;
        chrome.storage.local.get('projectTabs', (tabsResult) => {
          let tabUrls = [];
          if (tabsResult.projectTabs && tabsResult.projectTabs[projectName]) {
            tabUrls = tabsResult.projectTabs[projectName];
          } else {
            chrome.storage.local.set({ projectTabs: { ...tabsResult.projectTabs, [projectName]: [] } });
          }
          tabUrls.forEach(url => {
            chrome.tabs.create({ url, windowId: windowId });
          });
          chrome.storage.local.set({ [`selectedProject_${windowId}`]: projectName }, () => {
            chrome.storage.local.remove('projectToOpen', async () => {
              const updatedTabs = await fetchTabs({ windowId });
              if (updatedTabs.length != 1) {
                chrome.tabs.remove(newTabId);
              }
            });
          });
        });
      }
    });
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.local.remove([`selectedProject_${windowId}`], () => {
    chrome.runtime.sendMessage({ action: 'clearSelectedProject' }, (response) => {});
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
  removeCarryOverTab(tabId);
  updateProjectTabs('tabs.onRemoved');
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  updateProjectTabs('tabs.onDetached');
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  updateProjectTabs('tabs.onAttached');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateCarryOverTab(tabId, changeInfo);
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
