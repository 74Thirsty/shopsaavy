import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{product.category}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
        </div>
        <p className="flex-1 text-sm text-slate-600">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-brand-dark">${Number(product.price).toFixed(2)}</span>
          <Link
            to={`/product/${product.id}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-brand hover:text-brand"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
