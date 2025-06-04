
// Content script that runs on web pages
console.log('Extension content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getPageInfo') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }
  
  return true;
});

// Example: Add a simple indicator that the extension is active
const indicator = document.createElement('div');
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  z-index: 10000;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
`;
document.body.appendChild(indicator);

// Remove indicator after 3 seconds
setTimeout(() => {
  indicator.remove();
}, 3000);
