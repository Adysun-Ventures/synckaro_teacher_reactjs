import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { AuthData } from '@/types';

/**
 * useAuth Hook
 * 
 * Custom React hook for accessing authentication state
 * Provides current user, token, and authentication status
 * Automatically syncs with localStorage changes
 */
export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from storage on mount
    const loadAuthData = () => {
      try {
        const data = storage.getAuth();
        setAuthData(data);
      } catch (error) {
        console.error('Error loading auth data:', error);
        setAuthData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();

    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'syncKaro_auth') {
        try {
          const data = e.newValue ? JSON.parse(e.newValue) : null;
          setAuthData(data);
        } catch (error) {
          console.error('Error parsing auth data from storage event:', error);
          setAuthData(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    user: authData?.user || null,
    token: authData?.token || null,
    isAuthenticated: authData?.isAuthenticated || false,
    isLoading,
  };
}

