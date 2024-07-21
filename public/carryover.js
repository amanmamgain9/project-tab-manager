/* global chrome */
import { getFromLocalStorage, setToLocalStorage } from './chromeUtils.js';

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
  
// Function to add a tab to carryOverTabs
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

// Handle context menu click for Carry Over Tab
export async function updateContextMenu(tab) {
  try {
    const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
    const isCarryOver = carryOverTabs[tab.id] !== undefined;
    
    await new Promise((resolve, reject) => {
      chrome.contextMenus.update('carryOverTab', {
        title: isCarryOver ? "Remove Carry Over Tab" : "Mark as Carry Over Tab"
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
}

export async function handleContextMenuClick(info, tab) {
  try {
    const carryOverTabs = await getFromLocalStorage('carryOverTabs') || {};
    if (info.menuItemId === "carryOverTab") {
      if (carryOverTabs[tab.id]) {
        await removeCarryOverTab(tab.id);
        await new Promise((resolve, reject) => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Carry Over Tab",
            message: `Tab ${tab.url} removed from carry over.`,
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      } else {
        await addCarryOverTab(tab);
        await new Promise((resolve, reject) => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Carry Over Tab",
            message: `Tab ${tab.url} marked for carry over.`,
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      await updateContextMenu(tab); // Update the context menu title
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
}

export async function setupContextMenu() {
  try {
    await new Promise((resolve, reject) => {
      chrome.contextMenus.create({
        id: "carryOverTab",
        title: "Carry Over Tab",
        contexts: ["page", "selection", "link"],
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error setting up context menu:', error);
  }
}