
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const authContainer = document.querySelector('.auth-container');
  const nicknameInput = document.getElementById('nickname');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const loadingMessage = document.getElementById('loadingMessage');

  // Check if user is already logged in
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'getUserData' }, (response) => {
      if (response && response.isLoggedIn && response.userNickname) {
        showSuccessScreen(response.userNickname);
        return;
      }
      // Focus on nickname input if not logged in
      nicknameInput.focus();
    });
  } else {
    nicknameInput.focus();
  }

  // Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nickname = nicknameInput.value.trim();
    
    // Validate nickname
    if (!nickname || nickname.length < 2) {
      showError('Username must be at least 2 characters');
      return;
    }

    // Show loading state
    setLoadingState(true);

    try {
      // Check if we're in extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Save user data via background script
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'saveUserData',
            nickname: nickname
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        if (response && response.success) {
          // Show success screen
          showSuccessScreen(nickname);
          
          // Open extension popup after delay
          setTimeout(() => {
            chrome.action.openPopup();
          }, 2000);
        } else {
          showError(response?.error || 'Neural link failed - try again');
          setLoadingState(false);
        }
      } else {
        // Fallback for non-extension environment
        localStorage.setItem('userNickname', nickname);
        showSuccessScreen(nickname);
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      showError('System error - try again');
      setLoadingState(false);
    }
  });

  // Handle Enter key
  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  // Clear error on input
  nicknameInput.addEventListener('input', () => {
    hideError();
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    nicknameInput.classList.add('error');
  }

  function hideError() {
    errorMessage.style.display = 'none';
    nicknameInput.classList.remove('error');
  }

  function showSuccess(message) {
    loadingMessage.textContent = message;
    loadingMessage.style.display = 'block';
    loadingMessage.style.color = '#00ff00';
  }

  function setLoadingState(loading) {
    loginBtn.disabled = loading;
    nicknameInput.disabled = loading;
    
    if (loading) {
      loginBtn.textContent = 'CONNECTING...';
      loadingMessage.style.display = 'block';
      loadingMessage.style.color = '#ffff00';
      loadingMessage.textContent = 'Establishing neural connection...';
      hideError();
    } else {
      loginBtn.textContent = 'INITIALIZE NEURAL LINK';
      loadingMessage.style.display = 'none';
    }
  }

  function showSuccessScreen(nickname) {
    authContainer.innerHTML = `
      <div class="system-header">Neural Link Established</div>
      <div class="version-info">Connection Successful</div>
      
      <div class="status-line success-status">
        > User: ${nickname}<br>
        > Status: AUTHENTICATED<br>
        > Neural Core: ONLINE<br>
        > WebSocket: CONNECTED<span class="terminal-cursor">_</span>
      </div>
      
      <div class="success-content">
        <div class="success-message">
          <div class="success-title">WELCOME TO THE NETWORK</div>
          <div class="success-subtitle">You are now connected to Titan Terminal</div>
        </div>
        
        <div class="success-features">
          <div class="feature-item">✓ Neural Interface Active</div>
          <div class="feature-item">✓ T0 Network Connected</div>
          <div class="feature-item">✓ WebSocket Agent Online</div>
          <div class="feature-item">✓ Crypto Operations Ready</div>
        </div>
        
        <div class="success-info">
          Extension popup will open automatically.<br>
          You can close this tab when ready.
        </div>
      </div>
    `;

    // Add success-specific styles
    const style = document.createElement('style');
    style.textContent = `
      .success-status {
        background: rgba(16, 185, 129, 0.1);
        border-left: 2px solid #10b981;
      }
      
      .success-content {
        text-align: center;
        margin-top: 20px;
      }
      
      .success-message {
        margin-bottom: 25px;
      }
      
      .success-title {
        color: #10b981;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .success-subtitle {
        color: rgba(16, 185, 129, 0.8);
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .success-features {
        margin-bottom: 25px;
        text-align: left;
      }
      
      .feature-item {
        color: #10b981;
        font-size: 11px;
        margin-bottom: 8px;
        padding-left: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .success-info {
        color: rgba(16, 185, 129, 0.7);
        font-size: 10px;
        line-height: 1.4;
        text-transform: uppercase;
        border-top: 1px solid rgba(16, 185, 129, 0.2);
        padding-top: 15px;
      }
    `;
    document.head.appendChild(style);
  }
});
