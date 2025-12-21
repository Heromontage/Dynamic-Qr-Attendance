import CryptoJS from 'crypto-js';

export const generateSecureToken = (courseCode, date, teacherId) => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  
  const payload = {
    courseCode,
    date,
    teacherId,
    timestamp,
    nonce
  };

  // Encrypt payload
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(payload),
    process.env.REACT_APP_ENCRYPTION_KEY || 'default-key'
  ).toString();

  return {
    token: encrypted,
    timestamp,
    expiresAt: timestamp + 15000 // 15 seconds
  };
};

export const validateTokenFormat = (token) => {
  try {
    // Check if token is base64
    const decoded = atob(token);
    return decoded.length > 0;
  } catch (error) {
    return false;
  }
};

export const isTokenExpired = (tokenTimestamp) => {
  const currentTime = Date.now();
  const tokenAge = currentTime - tokenTimestamp;
  return tokenAge > 15000; // 15 seconds
};