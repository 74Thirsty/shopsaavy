import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { useProducts } from '../context/ProductContext.jsx';

export default function Home() {
  const { products, loading, error } = useProducts();
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  return (
    <div className="space-y-16">
      <Hero />
      <section className="space-y-8">
        <SectionTitle
          eyebrow="Featured"
          title="Product highlights"
          description="Demonstrate merchandising strategy with a curated product grid. Update featured collections instantly from the admin panel."
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
          <p className="text-slate-500">Loading featured products...</p>
        ) : error ? (
          <p className="text-rose-500">Unable to load products. Please refresh the page.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
      <section className="rounded-3xl bg-slate-900 px-10 py-12 text-white shadow-lg">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">No-code admin tool</p>
            <h3 className="text-3xl font-semibold">Empower clients to launch updates without engineering tickets.</h3>
            <p className="text-white/80">
              Editable tables, instant image previews, and confirmation modals make management effortless. Preview the admin
              workspace to see how your clients can own product storytelling.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand hover:text-white"
          >
            Open admin panel
          </Link>
        </div>
      </section>
    </div>
  );
}
