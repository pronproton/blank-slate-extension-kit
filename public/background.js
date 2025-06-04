
// Background script for extension installation handling

// URL and model name for Titan AI API
const TITAN_URL = 'http://localhost:11434/api/chat';
const TITAN_MODEL = 'titan-assistant'; // Замените на реальное имя модели, установленной в Ollama

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page in new tab when extension is first installed
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

// Check if user is logged in when extension icon is clicked
chrome.action.onClicked.addListener(async () => {
  const result = await chrome.storage.local.get(['isLoggedIn']);
  
  if (!result.isLoggedIn) {
    // User not logged in, redirect to welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } else {
    // User is logged in, open popup
    chrome.action.setPopup({
      popup: 'popup.html'
    });
  }
});

// Listen for messages from welcome page and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveUserData') {
    // Save user data to storage
    chrome.storage.local.set({
      userNickname: request.nickname,
      isLoggedIn: true,
      loginDate: new Date().toISOString()
    }).then(() => {
      // Enable popup after successful login
      chrome.action.setPopup({
        popup: 'popup.html'
      });
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error saving user data:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getUserData') {
    chrome.storage.local.get(['userNickname', 'isLoggedIn']).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      console.error('Error getting user data:', error);
      sendResponse({ isLoggedIn: false });
    });
    return true;
  }

  // Handle Titan AI requests
  if (request.action === 'sendToTitan') {
    fetch(TITAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TITAN_MODEL,
        messages: [
          {
            role: 'user',
            content: request.message
          }
        ],
        stream: false
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ 
        success: true, 
        content: data.message?.content || 'AI не ответил' 
      });
    })
    .catch(error => {
      console.error('Ошибка при обращении к Titan:', error);
      let errorMessage = 'Ошибка AI: неизвестная ошибка';
      
      if (error.name === 'TypeError') {
        errorMessage = 'Ошибка: не удаётся подключиться к AI серверу (проверьте, что Ollama запущен)';
      } else {
        errorMessage = `Ошибка AI: ${error.message}`;
      }
      
      sendResponse({ 
        success: false, 
        error: errorMessage 
      });
    });
    
    return true; // Keep message channel open for async response
  }
});
