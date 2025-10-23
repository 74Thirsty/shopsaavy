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
  const [highlight, ...rest] = siteName.split(' ');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-slate-900">
            {highlight ? (
              <>
                <span className="rounded bg-brand/10 px-2 py-1 text-brand-dark">{highlight}</span>
                {rest.length ? ` ${rest.join(' ')}` : ''}
              </>
            ) : (
              <span className="rounded bg-brand/10 px-2 py-1 text-brand-dark">SaavyShop Demo</span>
            )}
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `transition-colors hover:text-brand ${isActive ? 'text-brand-dark' : 'text-slate-500'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
