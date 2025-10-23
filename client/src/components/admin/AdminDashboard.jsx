import { useEffect, useState } from 'react';
import ProductFormModal from './ProductFormModal.jsx';

export default function AdminDashboard({ products, onCreate, onUpdate, onDelete, password, onLogout }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  function startEditing(product) {
    setEditingId(product.id);
    setDraft({ ...product });
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(null);
  }

  function openCreateModal() {
    setModalMode('create');
    setDraft(null);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setModalMode('edit');
    setDraft({ ...product });
    setIsModalOpen(true);
  }

  async function handleInlineSave() {
    if (!draft) return;
    try {
      setSubmitting(true);
      await onUpdate(editingId, draft, password);
      setToast('Product updated successfully');
      cancelEditing();
    } catch (error) {
      setToast('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleModalSubmit(data) {
    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await onCreate(data, password);
        setToast('Product created');
      } else if (draft) {
        await onUpdate(draft.id, data, password);
        setToast('Product updated');
      }
      setIsModalOpen(false);
      setDraft(null);
    } catch (error) {
      setToast('An error occurred while saving the product');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      setSubmitting(true);
      await onDelete(confirmDeleteId, password);
      setToast('Product removed');
    } catch (error) {
      setToast('Failed to remove product');
    } finally {
      setSubmitting(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
      <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin panel</p>
          <h2 className="text-2xl font-semibold text-slate-900">Catalog controls</h2>
          <p className="text-sm text-slate-500">
            Add, edit, or retire products instantly. Changes are reflected across the storefront in real time.
          </p>
        </div>
        <nav className="space-y-2 text-sm font-medium text-slate-500">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-brand/30 bg-brand/10 px-4 py-3 text-left text-brand-dark transition hover:border-brand hover:bg-brand/20"
          >
            Add new product
            <span className="text-lg">＋</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-rose-400 hover:text-rose-500"
          >
            Logout
          </button>
        </nav>
      </aside>
      <section className="space-y-6">
        {toast ? (
          <div className="rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark">
            {toast}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No products yet. Use "Add new product" to populate your storefront.
                  </td>
                </tr>
              ) : null}
              {products.map((product) => {
                const isEditing = editingId === product.id;
                return (
                  <tr key={product.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft?.name || ''}
                          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-xl border border-brand/30 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                        />
                      ) : (
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.description}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft?.category || ''}
                          onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                          className="w-full rounded-xl border border-brand/30 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                        />
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draft?.price ?? ''}
                          onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                          className="w-28 rounded-xl border border-brand/30 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                        />
                      ) : (
                        `$${Number(product.price).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleInlineSave}
                              disabled={submitting}
                              className="rounded-full bg-brand px-3 py-2 text-white transition hover:bg-brand-dark disabled:opacity-70"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 transition hover:border-slate-400"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(product)}
                              className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 transition hover:border-brand hover:text-brand"
                            >
                              Edit inline
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 transition hover:border-brand hover:text-brand"
                            >
                              Open modal
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="rounded-full border border-rose-200 px-3 py-2 text-rose-500 transition hover:border-rose-400 hover:text-rose-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ProductFormModal
        open={isModalOpen}
        title={modalMode === 'create' ? 'Add a new product' : `Edit ${draft?.name ?? ''}`}
        product={modalMode === 'edit' ? draft : undefined}
        onClose={() => {
          setIsModalOpen(false);
          setDraft(null);
        }}
        onSubmit={handleModalSubmit}
        submitting={submitting}
      />

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Delete product</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Are you sure?</h3>
              <p className="mt-3 text-sm text-slate-600">
                This action cannot be undone. The product will disappear from the storefront immediately after deletion.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-70"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
