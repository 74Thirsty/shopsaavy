import { useMemo } from 'react';
import AdminDashboard from '../components/admin/AdminDashboard.jsx';
import AdminLogin from '../components/admin/AdminLogin.jsx';
import SiteContentEditor from '../components/admin/SiteContentEditor.jsx';
import SiteSettingsPanel from '../components/admin/SiteSettingsPanel.jsx';
import { useProducts } from '../context/ProductContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useAdminAuth } from '../hooks/useAdminAuth.js';

export default function Admin() {
  const { products, createProduct, updateProduct, deleteProduct } = useProducts();
  const {
    content: siteContent,
    loading: siteContentLoading,
    error: siteContentError,
    updateContent: updateSiteContent
  } = useSiteContent();
  const {
    settings: siteSettings,
    loading: siteSettingsLoading,
    error: siteSettingsError,
    updateSiteName,
    updateLayout,
    cycleTheme,
    layoutOptions,
    themeOptions
  } = useSiteSettings();
  const { password, isAuthenticated, checking, error, verifyPassword, logout } = useAdminAuth();

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  if (!isAuthenticated) {
    return <AdminLogin onSubmit={verifyPassword} checking={checking} error={error} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin panel</p>
          <h1 className="text-4xl font-semibold text-slate-900">Product management workspace</h1>
          <p className="text-slate-600">
            Edit existing products in-place or open the modal editor for a guided experience. Add imagery, tweak pricing, and
            publish updates instantly across the storefront.
          </p>
        </div>
      </div>
      <AdminDashboard
        products={sortedProducts}
        onCreate={createProduct}
        onUpdate={updateProduct}
        onDelete={deleteProduct}
        password={password}
        onLogout={logout}
      />
      <SiteSettingsPanel
        siteName={siteSettings.siteName}
        onSubmit={updateSiteName}
        password={password}
        loading={siteSettingsLoading}
        error={siteSettingsError}
        layout={siteSettings.layout}
        layoutOptions={layoutOptions}
        onLayoutChange={updateLayout}
        theme={siteSettings.theme}
        themeOptions={themeOptions}
        onThemeToggle={cycleTheme}
      />
      <SiteContentEditor
        content={siteContent}
        loading={siteContentLoading}
        error={siteContentError}
        onSubmit={updateSiteContent}
        password={password}
      />
    </div>
  );
}
