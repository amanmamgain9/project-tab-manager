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