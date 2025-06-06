
export const generateUID = (): string => {
  const chars = '0123456789ABCDEF';
  let result = 'TT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getUserUID = (): string => {
  // Try to get from chrome extension storage first
  if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.storage) {
    // For extension environment, we'll return a placeholder and load async
    return 'Loading...';
  }
  
  // Fallback to localStorage for non-extension environment
  const stored = localStorage.getItem('titan_user_uid');
  if (stored) {
    return stored;
  }
  
  const newUID = generateUID();
  localStorage.setItem('titan_user_uid', newUID);
  return newUID;
};

// New async function for extension environment
export const getUserUIDAsync = async (): Promise<string> => {
  if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
    try {
      const response = await new Promise<any>((resolve) => {
        (window as any).chrome.runtime.sendMessage({ action: 'getUserData' }, resolve);
      });
      
      if (response && response.titan_user_uid) {
        return response.titan_user_uid;
      }
    } catch (error) {
      console.log('Could not load UID from extension storage');
    }
  }
  
  // Fallback to localStorage
  return getUserUID();
};
