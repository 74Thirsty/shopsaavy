import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="grid gap-10 rounded-3xl bg-gradient-to-br from-white via-white to-slate-100 p-10 shadow-sm md:grid-cols-[1fr,1.1fr] md:items-center">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">
          SaavyShop Demo
        </span>
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          Showcase products beautifully and update inventory without code.
        </h1>
        <p className="text-lg text-slate-600">
          This retail demo website pairs a premium storefront with an intuitive admin panel. Update product details, swap
          imagery, and launch campaigns in minutes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            Explore Products
          </Link>
          <Link
            to="/admin"
            className="rounded-full border border-brand px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10"
          >
            Manage Catalog
          </Link>
        </div>
      </div>
      <div className="relative h-72 overflow-hidden rounded-3xl bg-slate-900 shadow-lg md:h-full">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80"
          alt="Product display"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-slate-900/20" />
        <div className="absolute bottom-6 left-6 space-y-2 text-white">
          <p className="text-sm uppercase tracking-widest text-white/70">Featured Collection</p>
          <p className="text-2xl font-semibold">Curate a stunning brand showcase</p>
        </div>
      </div>
    </section>
  );
}
