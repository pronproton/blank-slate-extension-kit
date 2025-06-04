
// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
  }
  
  return true;
});
