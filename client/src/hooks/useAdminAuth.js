import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'saavyshop-admin-password';

const getInitialPassword = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem(STORAGE_KEY) || '';
};

export function useAdminAuth() {
  const [password, setPassword] = useState(getInitialPassword);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const verifyPassword = useCallback(
    async (candidate) => {
      setChecking(true);
      setError(null);
      try {
        await axios.post(
          '/api/admin/verify',
          {},
          {
            headers: {
              'x-admin-password': candidate
            }
          }
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, candidate);
        }
        setPassword(candidate);
        setIsAuthenticated(true);
        return true;
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
        setPassword('');
        setError('Invalid password');
        setIsAuthenticated(false);
        return false;
      } finally {
        setChecking(false);
      }
    },
    []
  );

  useEffect(() => {
    if (password) {
      verifyPassword(password);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setPassword('');
    setIsAuthenticated(false);
  }, []);

  return {
    password,
    isAuthenticated,
    checking,
    error,
    verifyPassword,
    logout
  };
}
