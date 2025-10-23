import { useEffect, useState } from 'react';

export default function ProductFormModal({ open, title, product, onClose, onSubmit, submitting }) {
  const [formData, setFormData] = useState(() =>
    product || {
      name: '',
      price: '',
      category: '',
      description: '',
      image: ''
    }
  );
  const [preview, setPreview] = useState(product?.image || '');

  useEffect(() => {
    if (product) {
      setFormData(product);
      setPreview(product.image || '');
    } else if (open) {
      setFormData({ name: '', price: '', category: '', description: '', image: '' });
      setPreview('');
    }
  }, [product, open]);

  if (!open) return null;

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setPreview(result);
      setFormData((current) => ({ ...current, image: result }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Catalog management</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
            Close
          </button>
        </div>
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(formData);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Product name
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Price
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Category
              <input
                type="text"
                value={formData.category}
                onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Image URL
              <input
                type="url"
                value={formData.image?.startsWith('data:') ? '' : formData.image}
                onChange={(event) => setFormData((current) => ({ ...current, image: event.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-600">
            Description
            <textarea
              value={formData.description}
              onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
            />
          </label>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600">Upload image</p>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview ? (
                <img src={preview} alt="Preview" className="h-40 w-full rounded-2xl object-cover" />
              ) : (
                <p className="text-sm text-slate-500">Drop an image to generate a live preview.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
            >
              {submitting ? 'Saving...' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
