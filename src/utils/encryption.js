export const encryptData = (data, key) => {
  // Simple XOR encryption for demo
  const encrypted = [];
  for (let i = 0; i < data.length; i++) {
    encrypted.push(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(String.fromCharCode(...encrypted));
};

export const decryptData = (encrypted, key) => {
  try {
    const data = atob(encrypted);
    const decrypted = [];
    for (let i = 0; i < data.length; i++) {
      decrypted.push(String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
    }
    return decrypted.join('');
  } catch (error) {
    return null;
  }
};

export const hashData = (data) => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};