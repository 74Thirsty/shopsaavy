import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const SiteSettingsContext = createContext();

const appearanceStorageKey = 'shopsaavy:appearance';

export const layoutOptions = [
  { value: 'classic', label: 'Classic split' },
  { value: 'spotlight', label: 'Spotlight showcase' },
  { value: 'magazine', label: 'Magazine grid' }
];

export const themeOptions = [
  { value: 'light', label: 'Daylight' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'sunset', label: 'Golden hour' }
];

const defaultSettings = {
  siteName: 'SaavyShop Demo',
  layout: layoutOptions[0].value,
  theme: themeOptions[0].value
};

function readStoredAppearance() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(appearanceStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const validLayout = layoutOptions.some((option) => option.value === parsed?.layout)
      ? parsed.layout
      : undefined;
    const validTheme = themeOptions.some((option) => option.value === parsed?.theme) ? parsed.theme : undefined;
    return {
      ...(validLayout ? { layout: validLayout } : null),
      ...(validTheme ? { theme: validTheme } : null)
    };
  } catch (error) {
    console.warn('Unable to read saved appearance preferences', error);
    return {};
  }
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...readStoredAppearance() }));
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { layout, theme } = settings;
    window.localStorage.setItem(appearanceStorageKey, JSON.stringify({ layout, theme }));
  }, [settings.layout, settings.theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.dataset.layout = settings.layout;
    document.body.dataset.theme = settings.theme;
  }, [settings.layout, settings.theme]);

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

  const updateLayoutPreference = useCallback((nextLayout) => {
    setSettings((current) => {
      const layout = layoutOptions.some((option) => option.value === nextLayout) ? nextLayout : current.layout;
      if (layout !== current.layout) {
        console.log('Layout switched to:', layout);
      }
      return { ...current, layout };
    });
  }, []);

  const setThemePreference = useCallback((nextTheme) => {
    setSettings((current) => {
      const theme = themeOptions.some((option) => option.value === nextTheme) ? nextTheme : current.theme;
      if (theme !== current.theme) {
        console.log('Theme changed to:', theme);
      }
      return { ...current, theme };
    });
  }, []);

  const cycleThemePreference = useCallback(() => {
    setSettings((current) => {
      const index = themeOptions.findIndex((option) => option.value === current.theme);
      const next = themeOptions[(index + 1) % themeOptions.length] ?? themeOptions[0];
      console.log('Theme changed to:', next.value);
      return { ...current, theme: next.value };
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      layoutOptions,
      themeOptions,
      refresh: fetchSettings,
      async updateSiteName(siteName, password) {
        const response = await mutateWithPassword(
          (config) => axios.put('/api/admin/site-config', { siteName }, config),
          password
        );
        setSettings((current) => ({ ...current, ...response.data }));
        return response.data;
      },
      updateLayout: updateLayoutPreference,
      setTheme: setThemePreference,
      cycleTheme: cycleThemePreference
    }),
    [
      settings,
      loading,
      error,
      fetchSettings,
      mutateWithPassword,
      updateLayoutPreference,
      setThemePreference,
      cycleThemePreference
    ]
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

