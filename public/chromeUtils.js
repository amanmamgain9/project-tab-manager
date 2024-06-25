export const fetchTabs = async (queryInfo) => {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
};

export const getLocalStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
};

export const setLocalStorage = async (items) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve();
    });
  });
};

export const removeLocalStorage = async (key) => {
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

export const getLocalStorageAll = async () => {
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
