import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/products', { params });
      setProducts(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
      products,
      loading,
      error,
      refresh: fetchProducts,
      async createProduct(product, password) {
        const response = await mutateWithPassword((config) => axios.post('/api/products', product, config), password);
        await fetchProducts();
        return response.data;
      },
      async updateProduct(id, product, password) {
        const response = await mutateWithPassword(
          (config) => axios.put(`/api/products/${id}`, product, config),
          password
        );
        await fetchProducts();
        return response.data;
      },
      async deleteProduct(id, password) {
        await mutateWithPassword((config) => axios.delete(`/api/products/${id}`, config), password);
        await fetchProducts();
      }
    }),
    [products, loading, error, fetchProducts, mutateWithPassword]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
