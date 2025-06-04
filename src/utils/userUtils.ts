
export const generateUID = (): string => {
  const chars = '0123456789ABCDEF';
  let result = 'TT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getUserUID = (): string => {
  const stored = localStorage.getItem('titan_user_uid');
  if (stored) {
    return stored;
  }
  
  const newUID = generateUID();
  localStorage.setItem('titan_user_uid', newUID);
  return newUID;
};
