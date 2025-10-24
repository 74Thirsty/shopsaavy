import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { useProducts } from '../context/ProductContext.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';

export default function Home() {
  const { products, loading, error } = useProducts();
  const {
    content: siteContent,
    loading: contentLoading,
    error: contentError
  } = useSiteContent();
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  return (
    <div className="home-page space-y-16">
      <Hero content={siteContent} />
      <section className="featured-section space-y-8">
        <SectionTitle
          eyebrow={siteContent.featuredEyebrow}
          title={siteContent.featuredTitle}
          description={siteContent.featuredDescription}
          actions={
            <Link
              to="/shop"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-brand hover:text-brand"
            >
              View all products
            </Link>
          }
        />
        {loading ? (
          <p className="featured-section__loading text-slate-500">Loading featured products...</p>
        ) : error ? (
          <p className="featured-section__error text-rose-500">Unable to load products. Please refresh the page.</p>
        ) : (
          <div className="featured-products grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {contentError ? (
          <p className="featured-section__content-error text-rose-500">
            Unable to load home page content. Using last known values.
          </p>
        ) : null}
      </section>
      <section className="spotlight-section rounded-3xl bg-slate-900 px-10 py-12 text-white shadow-lg">
        <div className="spotlight-section__layout flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="spotlight-section__copy max-w-xl space-y-4">
            <p className="spotlight-section__eyebrow text-sm uppercase tracking-[0.3em] text-white/60">
              {siteContent.spotlightEyebrow}
            </p>
            <h3 className="spotlight-section__title text-3xl font-semibold">{siteContent.spotlightTitle}</h3>
            <p className="spotlight-section__description text-white/80">{siteContent.spotlightDescription}</p>
          </div>
          <Link
            to={siteContent.spotlightCtaUrl || '/admin'}
            className="spotlight-section__cta inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand hover:text-white"
          >
            {siteContent.spotlightCtaLabel}
          </Link>
        </div>
        {contentLoading ? (
          <p className="spotlight-section__loading mt-6 text-sm text-white/70">Loading latest site content...</p>
        ) : null}
      </section>
    </div>
  );
}
