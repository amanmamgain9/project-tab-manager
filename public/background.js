let logQueue = [];
let isProcessingLogQueue = false;
let previousTabLists = {};

function processLogQueue() {
  if (logQueue.length > 0 && !isProcessingLogQueue) {
    isProcessingLogQueue = true;
    const logMessage = logQueue.shift();
    chrome.storage.local.get('eventLogs', (result) => {
      const logs = result.eventLogs || [];
      logs.push(logMessage);
      chrome.storage.local.set({ eventLogs: logs }, () => {
        isProcessingLogQueue = false;
        processLogQueue(); // Process the next log message in the queue
      });
    });
  }
}

function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  logQueue.push(logMessage);
  processLogQueue();
}

// Example usage of logEvent function
logEvent('Extension started');

// Fetch tabs abstraction
function fetchTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
}

// Your existing event listeners
chrome.runtime.onInstalled.addListener(() => {
  logEvent('Extension installed or updated');
  chrome.storage.local.set({ initialized: true });
});

chrome.runtime.onStartup.addListener(() => {
  logEvent('Browser started up');
  clearAllSelectedProjectsExceptOpenWindows();
});

chrome.windows.onCreated.addListener(async (window) => {
  let windowId = window.id;

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
            chrome.storage.local.set({ projectTabs: { ...tabsResult.projectTabs, [projectName]: [] } }, () => {
              // logEvent(`Initialized empty projectTabs for project: ${projectName}`);
            });
          }

          // Open project's tabs
          tabUrls.forEach(url => {
            chrome.tabs.create({ url, windowId: windowId });
          });

          // Set the selected project for the window
          chrome.storage.local.set({ [`selectedProject_${windowId}`]: projectName }, () => {
            // logEvent(`Set selectedProject for window ID ${windowId}: ${projectName}`);
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
  // logEvent(`Window removed: ${windowId}`);

  chrome.storage.local.remove([`selectedProject_${windowId}`], () => {
    // logEvent(`Removed selected project for window ${windowId}`);
    chrome.runtime.sendMessage({ action: 'clearSelectedProject' }, (response) => {
      // logEvent(`clearSelectedProject response: ${response}`);
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setNewWindowProject') {
    // logEvent(`Message received: setNewWindowProject with project ${message.project}`);
    chrome.storage.local.set({ projectToOpen: message.project }, () => {
      sendResponse({ status: 'success' });
    });
    return true; // Keep the message channel open for sendResponse
  } else if (message.action === 'clearSelectedProject') {
    // logEvent('Message received: clearSelectedProject');
    chrome.storage.local.remove('selectedProject', () => {
      sendResponse({ status: 'success' });
    });
    return true; // Keep the message channel open for sendResponse
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  // logEvent(`Tab created: ${tab.id} in window ${tab.windowId}`);
  updateProjectTabs('tabs.onCreated');
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // logEvent(`Tab removed: ${tabId} from window ${removeInfo.windowId}`);
  updateProjectTabs('tabs.onRemoved');
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  // logEvent(`Tab detached: ${tabId} from window ${detachInfo.oldWindowId}`);
  updateProjectTabs('tabs.onDetached');
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  // logEvent(`Tab attached: ${tabId} to window ${attachInfo.newWindowId}`);
  updateProjectTabs('tabs.onAttached');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // logEvent(`Tab updated: ${tabId} in window ${tab.windowId || 'unknown'}`);
  updateProjectTabs('tabs.onUpdated');
});

// Updated method to handle project tabs update
function updateProjectTabs(source) {
  logEvent(`Updating project tabs called from ${source}`);
  chrome.storage.local.get(null, (result) => {
    handleWindowTabs(result);
  });
}

async function handleWindowTabs(storageData) {
  const currentWindow = await chrome.windows.getCurrent();
  const currentWindowId = currentWindow.id;
  const selectedProjectKey = `selectedProject_${currentWindowId}`;

  const projectName = storageData[selectedProjectKey];

  if (projectName) {
    const tabs = await fetchTabs({ windowId: currentWindowId });
    logEvent(`Found ${tabs.length} tabs in window ${currentWindowId}`);
    const newTabUrls = tabs
      .map(tab => tab.url)
      .filter(url => url && url.trim() !== ""); // Filter out blank or empty URLs

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

function updateProjectTabsImmediately(windowId, projectName, newTabUrls) {
  chrome.storage.local.get('projectTabs', (result) => {
    const projectTabs = result.projectTabs || {};
    projectTabs[projectName] = newTabUrls;
    chrome.storage.local.set({ projectTabs }, () => {
      logEvent(`Updated tabs for project ${projectName} in window ${windowId} with tabs ${newTabUrls.join(', ')}`);
    });
  });
}


function clearAllSelectedProjectsExceptOpenWindows() {
  // logEvent('Clearing all selected projects except open windows');
  chrome.windows.getAll({}, (windows) => {
    const openWindowIds = windows.map(window => window.id);
    // logEvent(`Open window IDs: ${openWindowIds.join(', ')}`);
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
        chrome.storage.local.remove(keysToRemove, () => {
          // logEvent('Cleared selected projects for all closed windows');
        });
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "carryOverTab",
    title: "Carry Over Tab",
    contexts: ["page", "selection", "link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "carryOverTab") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Carry Over Tab",
      message: `Tab ${tab.url} marked for carry over.`,
    });
  }
});
