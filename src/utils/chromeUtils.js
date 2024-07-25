/* global chrome */
export const fetchTabs = async (queryInfo) => {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
};

export const getFromLocalStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
};

export const setToLocalStorage = async (items) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve();
    });
  });
};

export const removeFromLocalStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve();
    });
  });
};

export const createTab = async (createProperties) => {
  return new Promise((resolve) => {
    chrome.tabs.create(createProperties, (tab) => {
      resolve(tab);
    });
  });
};

export const removeTab = async (tabId) => {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabId, () => {
      resolve();
    });
  });
};

export const getFromLocalStorageAll = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      resolve(result);
    });
  });
};

export const getAllWindows = async () => {
  return new Promise((resolve) => {
    chrome.windows.getAll({}, (windows) => {
      resolve(windows);
    });
  });
};

export const getCurrentWindow = async () => {
  return new Promise((resolve) => {
    chrome.windows.getCurrent((window) => {
      resolve(window);
    });
  });
};

export const getFromLocalStorageMultiple = async (keys) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
};

export const removeFromLocalStorageMultiple = async (keys) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

async function removeTabFromProjectTabs(url) {
  chrome.storage.local.get(['projectTabs'], (result) => {
    const projectTabs = result.projectTabs || {};
    for (const projectName in projectTabs) {
      projectTabs[projectName] = projectTabs[projectName].filter(tabUrl => tabUrl !== url);
      setToLocalStorage({ projectTabs });
     }
    chrome.storage.local.set({ projectTabs });
  });
}

export async function addCarryOverTab(tab) {
  try {
    const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
    carryOverTabs[tab.id] = tab.url;
    await setToLocalStorage({ carryOverTabs });
    await removeTabFromProjectTabs(tab.url); // Remove from projectTabs if exists
  } catch (error) {
    console.error('Error adding carry over tab:', error);
  }
}

// Function to update carryOverTab URL when it changes
// need to remove from carry over list and add to project tabs
export async function updateCarryOverTab(tabId, changeInfo) {
  if (changeInfo.url) {
    try {
      const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
      if (carryOverTabs[tabId]) {
        carryOverTabs[tabId] = changeInfo.url;
        await setToLocalStorage({ carryOverTabs });
      }
    } catch (error) {
      console.error('Error updating carry over tab:', error);
    }
  }
}

// Function to remove a tab from carryOverTabs
// need to add to project tabs if exists
export async function removeCarryOverTab(tabId) {
  try {
    const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
    if (carryOverTabs[tabId]) {
      delete carryOverTabs[tabId];
      await setToLocalStorage({ carryOverTabs });
    }
  } catch (error) {
    console.error('Error removing carry over tab:', error);
  }
}

export const createNewWindow = async (currentWindow) => {
  const isMaximized = currentWindow.state === 'maximized';
  const newWindowOptions = {
    width: isMaximized ? undefined : currentWindow.width,
    height: isMaximized ? undefined : currentWindow.height,
    state: isMaximized ? 'maximized' : 'normal'
  };

  return new Promise((resolve) => {
    chrome.windows.create(newWindowOptions, resolve);
  });
};

// Categorize tabs into carry-over, non-carry-over, and active
export const categorizeTabs = (tabs, carryOverTabs) => {
  const tabsToMove = [];
  const tabsToRemove = [];
  const carryOverUrls = new Map();
  let activeTab = null;

  tabs.forEach(tab => {
    if (tab.active) {
      activeTab = tab;
    } else if (carryOverTabs[tab.id]) {
      tabsToMove.push(tab.id);
      carryOverUrls.set(tab.url, tab.id);
    } else {
      tabsToRemove.push(tab.id);
    }
  });

  return { tabsToMove, tabsToRemove, carryOverUrls, activeTab };
};

// Move carry-over tabs to the new window
export const moveCarryOverTabs = async (tabsToMove, newWindowId, carryOverUrls) => {
  if (tabsToMove.length === 0) return;
  try {
    const movedTabs = await new Promise((resolve, reject) => {
      chrome.tabs.move(tabsToMove, { windowId: newWindowId, index: -1 }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });

    const updatedCarryOverTabs = {};
    const processMovedTab = (tab) => {
      if (carryOverUrls.has(tab.url)) {
        const oldTabId = carryOverUrls.get(tab.url);
        updatedCarryOverTabs[tab.id] = tab.url;
        return removeCarryOverTab(oldTabId);
      }
    };

    if (Array.isArray(movedTabs)) {
      await Promise.all(movedTabs.map(processMovedTab));
    } else if (movedTabs) {
      await processMovedTab(movedTabs);
    }

    await Promise.all(
      Object.entries(updatedCarryOverTabs).map(([tabId, url]) => 
        addCarryOverTab({ id: parseInt(tabId), url })
      )
    );
  } catch (error) {
    console.error('Error moving carry-over tabs:', error);
    // You might want to add additional error handling here
  }
};

// Remove non-carry-over tabs
export const removeNonCarryOverTabs = async (tabsToRemove) => {
  console.log('tabsToRemove', tabsToRemove);
  if (tabsToRemove.length > 0) {
    await Promise.all(tabsToRemove.map(tabId => removeTab(tabId)));
  }
}

export const handleActiveTab = async (activeTab, carryOverTabs, newWindowId) => {
  if (activeTab) {
    if (carryOverTabs[activeTab.id]) {
      const movedTab = await chrome.tabs.move(activeTab.id, { windowId: newWindowId, index: -1 });
      await addCarryOverTab({ id: movedTab.id, url: movedTab.url });
      await removeCarryOverTab(activeTab.id);
    } else {
      await removeTab(activeTab.id);
    }
  }
};