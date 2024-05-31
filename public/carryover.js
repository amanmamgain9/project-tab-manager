// Function to add a tab to carryOverTabs
export function addCarryOverTab(tab) {
  chrome.storage.local.get(['carryOverTabs'], (result) => {
    const carryOverTabs = result.carryOverTabs || {};
    carryOverTabs[tab.id] = tab.url;
    chrome.storage.local.set({ carryOverTabs }, () => {
      removeTabFromProjectTabs(tab.url); // Remove from projectTabs if exists
    });
  });
}

// Function to update carryOverTab URL when it changes
export function updateCarryOverTab(tabId, changeInfo) {
  if (changeInfo.url) {
    chrome.storage.local.get(['carryOverTabs'], (result) => {
      const carryOverTabs = result.carryOverTabs || {};
      if (carryOverTabs[tabId]) {
        carryOverTabs[tabId] = changeInfo.url;
        chrome.storage.local.set({ carryOverTabs });
      }
    });
  }
}

// Function to remove a tab from carryOverTabs
export function removeCarryOverTab(tabId) {
  chrome.storage.local.get(['carryOverTabs'], (result) => {
    const carryOverTabs = result.carryOverTabs || {};
    if (carryOverTabs[tabId]) {
      delete carryOverTabs[tabId];
      chrome.storage.local.set({ carryOverTabs });
    }
  });
}

// Function to remove URL from projectTabs
function removeTabFromProjectTabs(url) {
  chrome.storage.local.get(['projectTabs'], (result) => {
    const projectTabs = result.projectTabs || {};
    for (const projectName in projectTabs) {
      projectTabs[projectName] = projectTabs[projectName].filter(tabUrl => tabUrl !== url);
    }
    chrome.storage.local.set({ projectTabs });
  });
}

// Handle context menu click for Carry Over Tab
export function updateContextMenu(tab) {
  chrome.storage.local.get(['carryOverTabs'], (result) => {
    const carryOverTabs = result.carryOverTabs || {};
    const isCarryOver = carryOverTabs[tab.id] !== undefined;
    
    chrome.contextMenus.update('carryOverTab', {
      title: isCarryOver ? "Remove Carry Over Tab" : "Mark as Carry Over Tab"
    });
  });
}

export function handleContextMenuClick(info, tab) {
  chrome.storage.local.get(['carryOverTabs'], (result) => {
    const carryOverTabs = result.carryOverTabs || {};
    if (info.menuItemId === "carryOverTab") {
      if (carryOverTabs[tab.id]) {
        removeCarryOverTab(tab.id);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Carry Over Tab",
          message: `Tab ${tab.url} removed from carry over.`,
        });
      } else {
        addCarryOverTab(tab);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Carry Over Tab",
          message: `Tab ${tab.url} marked for carry over.`,
        });
      }
      updateContextMenu(tab); // Update the context menu title
    }
  });
}



export function setupContextMenu() {
  chrome.contextMenus.create({
    id: "carryOverTab",
    title: "Carry Over Tab",
    contexts: ["page", "selection", "link"],
  });
}