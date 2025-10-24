import { Link } from 'react-router-dom';

export default function Hero({ content }) {
  const {
    heroBadge,
    heroTitle,
    heroDescription,
    heroPrimaryLabel,
    heroPrimaryUrl,
    heroSecondaryLabel,
    heroSecondaryUrl,
    heroImage,
    heroSpotlightEyebrow,
    heroSpotlightTitle
  } = content;

  return (
    <section className="hero-section grid gap-10 rounded-3xl bg-gradient-to-br from-white via-white to-slate-100 p-10 shadow-sm md:grid-cols-[1fr,1.1fr] md:items-center">
      <div className="hero-copy space-y-6">
        <span className="hero-badge inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">
          {heroBadge}
        </span>
        <h1 className="hero-title text-4xl font-bold text-slate-900 md:text-5xl">{heroTitle}</h1>
        <p className="hero-description text-lg text-slate-600">{heroDescription}</p>
        <div className="hero-actions flex flex-wrap gap-3">
          <Link
            to={heroPrimaryUrl || '#'}
            className="hero-primary-btn rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            {heroPrimaryLabel}
          </Link>
          <Link
            to={heroSecondaryUrl || '#'}
            className="hero-secondary-btn rounded-full border border-brand px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10"
          >
            {heroSecondaryLabel}
          </Link>
        </div>
      </div>
      <div className="hero-media relative h-72 overflow-hidden rounded-3xl bg-slate-900 shadow-lg md:h-full">
        <img
          src={heroImage}
          alt="Product display"
          className="h-full w-full object-cover"
        />
        <div className="hero-media-overlay absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-slate-900/20" />
        <div className="hero-media-caption absolute bottom-6 left-6 space-y-2 text-white">
          <p className="text-sm uppercase tracking-widest text-white/70">{heroSpotlightEyebrow}</p>
          <p className="text-2xl font-semibold">{heroSpotlightTitle}</p>
        </div>
      </div>
    </section>
  );
}
