
/* popup.js — вывод адресов без всплывающих окон */
/* global chrome */

const box = document.getElementById('out');

/* Человеко-читаемые названия сетей */
function chainLabel(id) {
  return ({
    ethereum: 'Ethereum',
    solana  : 'Solana',
    bitcoin : 'Bitcoin',
    cosmos  : 'Cosmos'
  })[id] ?? id;
}

/* Рендер списка кошельков */
function render(wallets = {}) {
  box.innerHTML = '';
  if (!Object.keys(wallets).length) { box.className = 'empty'; return; }

  box.className = '';
  for (const [chain, addrs] of Object.entries(wallets)) {
    box.insertAdjacentHTML('beforeend', `<strong>${chainLabel(chain)}</strong>`);
    const ul = document.createElement('ul');
    [...new Set(addrs)].forEach(a => ul.insertAdjacentHTML('beforeend', `<li>${a}</li>`));
    box.appendChild(ul);
  }
}

/* Сохранение найденных кошельков */
async function saveWallets(wallets) {
  if (!Object.keys(wallets).length) return;
  
  try {
    // Получаем существующие кошельки
    const result = await chrome.storage.local.get(['detected_wallets']);
    const existing = result.detected_wallets || {};
    
    // Объединяем с новыми
    const merged = { ...existing };
    for (const [chain, addrs] of Object.entries(wallets)) {
      if (!merged[chain]) merged[chain] = [];
      const uniqueAddrs = [...new Set([...merged[chain], ...addrs])];
      merged[chain] = uniqueAddrs;
    }
    
    // Сохраняем
    await chrome.storage.local.set({ 
      detected_wallets: merged,
      wallets_last_scan: new Date().toISOString()
    });
    
    // Отправляем в background для WebSocket
    chrome.runtime.sendMessage({
      action: 'walletsDetected',
      wallets: merged
    });
    
    console.log('Wallets saved:', merged);
  } catch (error) {
    console.error('Error saving wallets:', error);
  }
}

/* Основная логика — выполняется в контексте страницы */
function queryWallets() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) { render(); return; }

    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      world : 'MAIN',
      func  : async () => {
        const out = {};

        /* ────────────────────────────────
           1. EVM-кошельки (MetaMask-/Backpack-/Phantom-EVM и др.)
           ──────────────────────────────── */
        const rootEth = window.ethereum;
        if (rootEth) {
          const evmProviders = Array.isArray(rootEth.providers) ? rootEth.providers : [rootEth];
          for (const p of evmProviders) {
            if (typeof p.request !== 'function') continue;
            try {
              const acc = await p.request({ method: 'eth_accounts' });   // молча
              if (acc?.length) (out.ethereum ??= []).push(...acc);
            } catch {/* игнорируем */}
          }
        }

        /* ────────────────────────────────
           2. Solana-кошельки (Phantom, Backpack, Solflare, Glow…)
           ──────────────────────────────── */
        const solProviders = [
          window.solana,
          window.phantom?.solana,
          window.backpack?.solana,
          window.solflare
        ].filter(Boolean);

        for (const s of solProviders) {
          if (typeof s.connect !== 'function') continue;
          try { await s.connect({ onlyIfTrusted: true }); } catch {}
          if (s.publicKey) (out.solana ??= []).push(s.publicKey.toString());
        }

        /* ────────────────────────────────
           3. Bitcoin-кошельки
              • Phantom (bitcoin)
              • UniSat
              • Xverse / OKX — провайдеры на window.btc
           ──────────────────────────────── */
        const btcProviders = [
          window.phantom?.bitcoin,     // Phantom
          window.unisat,               // UniSat
          window.btc,                  // Xverse, OKX и др., след. BIP-протокол
          window.okxwallet?.bitcoin
        ].filter(Boolean);

        for (const b of btcProviders) {
          try {
            let list = [];
            if (typeof b.getAccounts === 'function') {
              list = await b.getAccounts();              // UniSat, Xverse
            } else if (typeof b.request === 'function') {
              list = await b.request({ method: 'getAccounts' });
            } else if (Array.isArray(b.accounts)) {
              list = b.accounts.map(a => a.address ?? a);
            }
            if (list?.length) (out.bitcoin ??= []).push(...list);
          } catch {/* игнорируем */}
        }

        /* ────────────────────────────────
           4. Cosmos-кошельки (Keplr)
           ──────────────────────────────── */
        if (window.keplr?.getKey) {
          for (const cid of ['cosmoshub-4', 'osmosis-1']) {
            try {
              const { bech32Address } = await window.keplr.getKey(cid);  // тихо
              if (bech32Address) (out.cosmos ??= []).push(bech32Address);
            } catch {}
          }
        }

        return out;          // адреса → в popup
      }
    }, ([res]) => {
      const wallets = res?.result || {};
      render(wallets);
      saveWallets(wallets);
    });
  });
}

/* Стартуем один раз при открытии popup */
queryWallets();
