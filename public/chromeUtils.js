/* global chrome */
import { logEvent } from "./log.js";


export const fetchTabs = async (queryInfo) => {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
};

export const getFromLocalStorage = async (key) => {
  // logEvent(`Getting ${key} from local storage`);
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      // logEvent(`result for ${key}: ${result[key]}`);
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

export async function clearInactiveSelectedProjects() {
  const currentWindow = await getCurrentWindow();
  const currentWindowId = currentWindow.id;
  const result = await getFromLocalStorageAll();
  const keysToRemove = [];

  for (const key in result) {
    if (key.startsWith('selectedProject_')) {
      const windowId = parseInt(key.split('_')[1]);
      if (windowId !== currentWindowId) {
        keysToRemove.push(key);
      }
    }
  }
  if (keysToRemove.length > 0) {
    await removeFromLocalStorageMultiple(keysToRemove);
  }
}
