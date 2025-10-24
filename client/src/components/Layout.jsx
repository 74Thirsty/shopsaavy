import { Link, NavLink } from 'react-router-dom';
import Footer from './Footer.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/admin', label: 'Admin' }
];

export default function Layout({ children }) {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || 'SaavyShop Demo';
  const layoutKey = settings.layout || 'classic';
  const [highlight, ...rest] = siteName.split(' ');

  return (
    <div className={`app-shell layout-${layoutKey}`}>
      <header className="site-header sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="site-header__content mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="site-brand text-xl font-semibold text-slate-900">
            {highlight ? (
              <>
                <span className="brand-highlight rounded px-2 py-1 text-brand-dark">{highlight}</span>
                {rest.length ? ` ${rest.join(' ')}` : ''}
              </>
            ) : (
              <span className="brand-highlight rounded px-2 py-1 text-brand-dark">SaavyShop Demo</span>
            )}
          </Link>
          <nav className="site-nav flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `nav-link transition-colors ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="site-main mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
