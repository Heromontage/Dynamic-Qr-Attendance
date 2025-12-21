import { useState, useEffect, useCallback } from 'react';

export const useQRCode = (initialCountdown = 15) => {
  const [token, setToken] = useState(null);
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(initialCountdown);
    }
  }, [countdown, isActive, initialCountdown]);

  const generateToken = useCallback(() => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const newToken = btoa(`${timestamp}:${randomStr}`);
    setToken(newToken);
    setCountdown(initialCountdown);
    return newToken;
  }, [initialCountdown]);

  const startGeneration = useCallback(() => {
    setIsActive(true);
    generateToken();
  }, [generateToken]);

  const stopGeneration = useCallback(() => {
    setIsActive(false);
    setToken(null);
    setCountdown(initialCountdown);
  }, [initialCountdown]);

  return {
    token,
    countdown,
    isActive,
    generateToken,
    startGeneration,
    stopGeneration
  };
};