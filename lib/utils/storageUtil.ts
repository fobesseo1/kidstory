import { useState, useEffect } from 'react';

const isMobile = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  return false;
};

const storageUtil = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    if (isMobile()) {
      return sessionStorage.getItem(key);
    }
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    if (isMobile()) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    if (isMobile()) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  },
  getAllKeys: () => {
    if (typeof window === 'undefined') return [];
    if (isMobile()) {
      return Object.keys(sessionStorage);
    }
    return Object.keys(localStorage);
  },
};

export function useOptimizedStorage() {
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  return isClientSide ? storageUtil : null;
}
