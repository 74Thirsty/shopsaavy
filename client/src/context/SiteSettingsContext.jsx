import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const SiteSettingsContext = createContext();

const defaultSettings = {
  siteName: 'SaavyShop Demo'
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/config');
      setSettings((current) => ({ ...current, ...response.data }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const mutateWithPassword = useCallback(async (fn, password) => {
    if (!password) {
      throw new Error('Admin password is required');
    }
    return fn({
      headers: {
        'x-admin-password': password
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh: fetchSettings,
      async updateSiteName(siteName, password) {
        const response = await mutateWithPassword(
          (config) => axios.put('/api/admin/site-config', { siteName }, config),
          password
        );
        setSettings((current) => ({ ...current, ...response.data }));
        return response.data;
      }
    }),
    [settings, loading, error, fetchSettings, mutateWithPassword]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

