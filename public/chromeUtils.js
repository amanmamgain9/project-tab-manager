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
