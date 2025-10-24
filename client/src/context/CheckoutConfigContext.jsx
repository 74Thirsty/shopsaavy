import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const CheckoutConfigContext = createContext();

const defaultConfig = {
  googleFormUrl: '',
  microsoftFormUrl: '',
  secureCheckoutLabel: 'Secure checkout',
  secureCheckoutUrl: '',
  instructions:
    'Choose a secure payment option or use one of the order form templates to collect requests from budget-conscious customers.'
};

export function CheckoutConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/checkout-config');
      setConfig({ ...defaultConfig, ...response.data });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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
      config,
      loading,
      error,
      refresh: fetchConfig,
      async updateConfig(nextConfig, password) {
        const response = await mutateWithPassword(
          (configOptions) => axios.put('/api/checkout-config', nextConfig, configOptions),
          password
        );
        setConfig({ ...defaultConfig, ...response.data });
        return response.data;
      }
    }),
    [config, loading, error, fetchConfig, mutateWithPassword]
  );

  return <CheckoutConfigContext.Provider value={value}>{children}</CheckoutConfigContext.Provider>;
}

export function useCheckoutConfig() {
  const context = useContext(CheckoutConfigContext);
  if (!context) {
    throw new Error('useCheckoutConfig must be used within a CheckoutConfigProvider');
  }
  return context;
}
