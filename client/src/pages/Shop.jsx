import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { useProducts } from '../context/ProductContext.jsx';

export default function Shop() {
  const { products, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category).filter(Boolean));
    return ['all', ...unique];
  }, [products]);

  const highestPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.ceil(Math.max(...products.map((product) => Number(product.price))));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => (selectedCategory === 'all' ? true : product.category === selectedCategory))
      .filter((product) => (maxPrice ? Number(product.price) <= Number(maxPrice) : true))
      .filter((product) => product.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, selectedCategory, maxPrice, search]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Shop"
        title="Browse the SaavyShop collection"
        description="Filters demonstrate how customers can discover products by category or price point. Update inventory from the admin panel to see instant changes."
      />
      <div className="flex flex-wrap items-end gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Category
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All categories' : category}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Max price
          <div className="mt-1 flex items-center gap-3">
            <input
              type="range"
              min="0"
              max={highestPrice}
              value={maxPrice || highestPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-48"
            />
            <input
              type="number"
              min="0"
              max={highestPrice}
              value={maxPrice || ''}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={`Up to $${highestPrice}`}
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setMaxPrice('')}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-brand hover:text-brand"
            >
              Clear
            </button>
          </div>
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find products"
            className="mt-1 w-64 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none"
          />
        </label>
      </div>
      {loading ? (
        <p className="text-slate-500">Loading products...</p>
      ) : error ? (
        <p className="text-rose-500">Unable to load products. Please refresh the page.</p>
      ) : filteredProducts.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No products match your filters. Try adjusting the options above.
        </div>
      )}
    </div>
  );
}
