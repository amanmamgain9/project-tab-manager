let logQueue = [];
let isProcessingLogQueue = false;

export function processLogQueue() {
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

export function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  logQueue.push(logMessage);
  processLogQueue();
}

// Example usage of logEvent function
logEvent('Extension started');
