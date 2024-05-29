/*global chrome*/
// src/utils/storage.js
export const getFromStorage = (keys, callback) => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(keys, callback);
    } else {
      const storedData = keys.reduce((result, key) => {
        result[key] = JSON.parse(localStorage.getItem(key));
        return result;
      }, {});
      callback(storedData);
    }
  };
  
  export const setToStorage = (items, callback) => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set(items, callback);
    } else {
      Object.keys(items).forEach(key => {
        localStorage.setItem(key, JSON.stringify(items[key]));
      });
      if (callback) callback();
    }
  };
  
  export const removeFromStorage = (keys, callback) => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.remove(keys, callback);
    } else {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      if (callback) callback();
    }
  };
  