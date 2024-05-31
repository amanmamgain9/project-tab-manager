import { logEvent } from './log.js';

export function fetchTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
}

export function clearAllSelectedProjectsExceptOpenWindows() {
  chrome.windows.getAll({}, (windows) => {
    const openWindowIds = windows.map(window => window.id);
    chrome.storage.local.get(null, (result) => {
      const keysToRemove = [];
      for (const key in result) {
        if (key.startsWith('selectedProject_')) {
          const windowId = parseInt(key.split('_')[1]);
          if (!openWindowIds.includes(windowId)) {
            keysToRemove.push(key);
          }
        }
      }
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {});
      }
    });
  });
}

export async function handleWindowTabs(storageData) {
  const currentWindow = await chrome.windows.getCurrent();
  const currentWindowId = currentWindow.id;
  const selectedProjectKey = `selectedProject_${currentWindowId}`;
  const projectName = storageData[selectedProjectKey];

  if (projectName) {
    const tabs = await fetchTabs({ windowId: currentWindowId });
    logEvent(`Found ${tabs.length} tabs in window ${currentWindowId}`);
    const carryOverTabs = storageData.carryOverTabs || {};
    const newTabUrls = tabs
      .map(tab => tab.url)
      .filter(url => url && url.trim() !== "" && !Object.values(carryOverTabs).includes(url)); // Exclude carryover tab URLs

    const oldTabUrls = previousTabLists[projectName] || [];

    // Check if the number of tabs has decreased
    if (newTabUrls.length < oldTabUrls.length) {
      setTimeout(() => {
        updateProjectTabsImmediately(currentWindowId, projectName, newTabUrls);
      }, 2000); // 2-second delay
    } else {
      updateProjectTabsImmediately(currentWindowId, projectName, newTabUrls);
    }

    previousTabLists[projectName] = newTabUrls; // Update the previous tab list
  }
}


export function updateProjectTabs(source) {
  logEvent(`Updating project tabs called from ${source}`);
  chrome.storage.local.get(null, (result) => {
    handleWindowTabs(result);
  });
}

export function updateProjectTabsImmediately(windowId, projectName, newTabUrls) {
  chrome.storage.local.get('projectTabs', (result) => {
    const projectTabs = result.projectTabs || {};
    projectTabs[projectName] = newTabUrls;
    chrome.storage.local.set({ projectTabs }, () => {
      logEvent(`Updated tabs for project ${projectName} in window ${windowId} with tabs ${newTabUrls.join(', ')}`);
    });
  });
}

let previousTabLists = {};