
// Background script for extension installation handling

// URL and model name for Titan AI API
const TITAN_URL = 'http://localhost:11434/api/chat';
const TITAN_MODEL = 'titan-assistant';

// T0 Network configuration
const T0_AUTH_URL = 'https://t0.network/auth';
const T0_CONFIG_URL = 'https://t0.network/config';

// Generate UID function (same as in userUtils.ts)
function generateUID() {
  const chars = '0123456789ABCDEF';
  let result = 'TT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get or create user UID
async function getUserUID() {
  const result = await chrome.storage.local.get(['titan_user_uid']);
  if (result.titan_user_uid) {
    return result.titan_user_uid;
  }
  
  const newUID = generateUID();
  await chrome.storage.local.set({ titan_user_uid: newUID });
  return newUID;
}

// Auth user with T0 Network
async function authWithT0Network(userUID, nickname) {
  try {
    const response = await fetch(T0_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: userUID,
        nickname: nickname,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log('Successfully authenticated with T0 Network');
      return true;
    } else {
      console.error('T0 Network auth failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('T0 Network auth error:', error);
    return false;
  }
}

// Update rules from T0 Network
async function updateRulesFromT0() {
  try {
    const response = await fetch(T0_CONFIG_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const config = await response.json();
      console.log('T0 Network config updated:', config);
      
      // Store config in local storage
      await chrome.storage.local.set({ 
        t0_config: config,
        t0_config_updated: new Date().toISOString()
      });
      
      return config;
    } else {
      console.error('Failed to fetch T0 config:', response.status);
      return null;
    }
  } catch (error) {
    console.error('T0 Network config fetch error:', error);
    return null;
  }
}

// Set up periodic config updates (every minute)
function setupPeriodicUpdates() {
  // Initial update
  updateRulesFromT0();
  
  // Set up interval for every minute (60000ms)
  setInterval(() => {
    updateRulesFromT0();
  }, 60000);
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page in new tab when extension is first installed
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
  
  // Start periodic updates
  setupPeriodicUpdates();
});

// Start periodic updates when service worker starts
chrome.runtime.onStartup.addListener(() => {
  setupPeriodicUpdates();
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
    // Get or create UID
    getUserUID().then(async (userUID) => {
      try {
        // Save user data to storage
        await chrome.storage.local.set({
          userNickname: request.nickname,
          isLoggedIn: true,
          loginDate: new Date().toISOString(),
          titan_user_uid: userUID
        });
        
        // Authenticate with T0 Network
        const authSuccess = await authWithT0Network(userUID, request.nickname);
        
        // Enable popup after successful login
        chrome.action.setPopup({
          popup: 'popup.html'
        });
        
        sendResponse({ 
          success: true, 
          uid: userUID,
          t0_auth: authSuccess
        });
      } catch (error) {
        console.error('Error saving user data:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getUserData') {
    getUserUID().then(async (userUID) => {
      try {
        const result = await chrome.storage.local.get(['userNickname', 'isLoggedIn']);
        sendResponse({
          ...result,
          titan_user_uid: userUID
        });
      } catch (error) {
        console.error('Error getting user data:', error);
        sendResponse({ isLoggedIn: false });
      }
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
