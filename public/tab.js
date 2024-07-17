import { logEvent } from './log.js';

export function fetchTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
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
    // const carryOverTabs = storageData.carryOverTabs || {};
    const newTabUrls = tabs
      .map(tab => tab.url)
      .filter(url => url && url.trim() !== ""
       && !Object.values(carryOverTabs).includes(url)); // Exclude carryover tab URLs
    
    const oldTabUrls = previousTabLists[projectName] || [];
    updateProjectTabsImmediately(currentWindowId, projectName, newTabUrls);
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
