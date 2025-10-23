import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { useProducts } from '../context/ProductContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/products/${id}`);
        if (isMounted) {
          setProduct(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Product not found');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const fallbackImage =
    product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80';

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 3);
  }, [product, products]);

  const galleryImages = useMemo(() => Array.from({ length: 4 }, () => fallbackImage), [fallbackImage]);

  if (loading) {
    return <p className="text-slate-500">Loading product...</p>;
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">{error || 'Product unavailable'}</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-brand hover:text-brand"
        >
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm">
            <img src={fallbackImage} alt={product.name} className="h-[420px] w-full rounded-2xl object-cover" />
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((image, index) => (
                <img
                  key={`${product.id}-gallery-${index}`}
                  src={image}
                  alt={`${product.name} preview ${index + 1}`}
                  className="h-20 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.category}</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">{product.name}</h1>
          </div>
          <p className="text-lg text-slate-600">{product.description}</p>
          <p className="text-3xl font-semibold text-brand-dark">${Number(product.price).toFixed(2)}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand/30 transition hover:bg-brand-dark"
          >
            Add to cart
          </button>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why customers love it</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Premium materials sourced responsibly</li>
              <li>• Designed for daily use and long-lasting durability</li>
              <li>• Ships within 2-3 business days worldwide</li>
            </ul>
          </div>
        </div>
      </div>
      <section className="space-y-6">
        <SectionTitle eyebrow="You may also like" title="Related products" />
        {relatedProducts.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            More related items will appear as you expand your catalog.
          </p>
        )}
      </section>
    </div>
  );
}
