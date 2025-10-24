import { useEffect, useMemo, useState } from 'react';

const fieldConfig = [
  {
    name: 'secureCheckoutLabel',
    label: 'Secure checkout label',
    helper: 'Displayed on the primary secure checkout card on the storefront checkout hub.',
    type: 'text'
  },
  {
    name: 'secureCheckoutUrl',
    label: 'Secure checkout URL',
    helper: 'Link customers to a PCI-compliant checkout such as Stripe, Square, Shopify, or another hosted payment page.',
    type: 'url'
  },
  {
    name: 'googleFormUrl',
    label: 'Google Forms link (optional)',
    helper: 'Paste a Google Form share URL to embed a lightweight order request form.',
    type: 'url'
  },
  {
    name: 'microsoftFormUrl',
    label: 'Microsoft Forms link (optional)',
    helper: 'Paste a Microsoft Form share URL to offer an alternative order intake flow.',
    type: 'url'
  }
];

export default function CheckoutIntegrationEditor({ config, onSubmit, password, loading, error }) {
  const [formState, setFormState] = useState(config);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState(config);
  }, [config]);

  const hasChanges = useMemo(() => JSON.stringify(formState) !== JSON.stringify(config), [formState, config]);

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleInstructionsChange = (event) => {
    handleChange('instructions', event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) {
      setStatus({ type: 'error', message: 'Provide the admin password to publish changes.' });
      return;
    }
    if (!hasChanges) {
      setStatus({ type: 'info', message: 'No changes to save.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);
      const updated = await onSubmit(formState, password);
      setFormState(updated);
      setStatus({ type: 'success', message: 'Checkout options updated successfully.' });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update checkout options.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormState(config);
    setStatus(null);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout experiences</p>
        <h2 className="text-2xl font-semibold text-slate-900">Checkout integration manager</h2>
        <p className="text-sm text-slate-500">
          Configure a hosted, secure payment page alongside budget-friendly order form links. These settings feed the checkout hub
          available on the storefront navigation.
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          Unable to load the latest checkout configuration. Saving changes will overwrite the stored values.
        </div>
      ) : null}
      {status ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : status.type === 'error'
              ? 'border border-rose-200 bg-rose-50 text-rose-600'
              : 'border border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {status.message}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {fieldConfig.map((field) => (
            <label key={field.name} htmlFor={field.name} className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={formState[field.name] ?? ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
                placeholder={field.type === 'url' ? 'https://…' : undefined}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <p className="text-xs text-slate-500">{field.helper}</p>
            </label>
          ))}
        </div>
        <label htmlFor="instructions" className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Introductory message</span>
          <textarea
            id="instructions"
            name="instructions"
            rows={4}
            value={formState.instructions ?? ''}
            onChange={handleInstructionsChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Explain how shoppers should choose between the secure checkout and lightweight form options."
          />
          <p className="text-xs text-slate-500">
            This copy appears at the top of the checkout hub page, helping customers choose the best path.
          </p>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !hasChanges}
            className="rounded-full bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Saving changes…' : 'Save checkout options'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || !hasChanges}
            className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 disabled:opacity-60"
          >
            Reset
          </button>
          {loading ? <span className="text-sm text-slate-500">Loading latest configuration…</span> : null}
        </div>
      </form>
    </section>
  );
}
