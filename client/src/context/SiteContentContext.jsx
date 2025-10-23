import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const SiteContentContext = createContext();

const defaultContent = {
  heroBadge: 'SaavyShop Demo',
  heroTitle: 'Showcase products beautifully and update inventory without code.',
  heroDescription:
    'This retail demo website pairs a premium storefront with an intuitive admin panel. Update product details, swap imagery, and launch campaigns in minutes.',
  heroPrimaryLabel: 'Explore Products',
  heroPrimaryUrl: '/shop',
  heroSecondaryLabel: 'Manage Catalog',
  heroSecondaryUrl: '/admin',
  heroImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80',
  heroSpotlightEyebrow: 'Featured Collection',
  heroSpotlightTitle: 'Curate a stunning brand showcase',
  featuredEyebrow: 'Featured',
  featuredTitle: 'Product highlights',
  featuredDescription:
    'Demonstrate merchandising strategy with a curated product grid. Update featured collections instantly from the admin panel.',
  spotlightEyebrow: 'No-code admin tool',
  spotlightTitle: 'Empower clients to launch updates without engineering tickets.',
  spotlightDescription:
    'Editable tables, instant image previews, and confirmation modals make management effortless. Preview the admin workspace to see how your clients can own product storytelling.',
  spotlightCtaLabel: 'Open admin panel',
  spotlightCtaUrl: '/admin'
};

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/site-content');
      setContent(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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
      content,
      loading,
      error,
      refresh: fetchContent,
      async updateContent(updatedContent, password) {
        const response = await mutateWithPassword(
          (config) => axios.put('/api/site-content', updatedContent, config),
          password
        );
        setContent(response.data);
        return response.data;
      }
    }),
    [content, loading, error, fetchContent, mutateWithPassword]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}
