import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

export default function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || 'SaavyShop Demo';
  return (
    <footer className="site-footer border-t border-slate-200 bg-white/80">
      <div className="site-footer__content mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {siteName}. Crafted to showcase a customizable retail storefront experience.
        </p>
        <div className="flex items-center gap-4">
          <a href="mailto:hello@saavyshop.demo" className="hover:text-brand">
            hello@saavyshop.demo
          </a>
          <a href="https://www.linkedin.com" className="hover:text-brand" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="https://www.instagram.com" className="hover:text-brand" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
