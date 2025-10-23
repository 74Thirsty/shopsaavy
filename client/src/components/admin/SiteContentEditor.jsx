import { useEffect, useMemo, useState } from 'react';

const fieldGroups = [
  {
    title: 'Hero section',
    description: 'Control the hero copy, calls-to-action, and imagery shown at the top of the home page.',
    fields: [
      { name: 'heroBadge', label: 'Badge text', type: 'text' },
      { name: 'heroTitle', label: 'Headline', type: 'textarea' },
      { name: 'heroDescription', label: 'Description', type: 'textarea' },
      { name: 'heroPrimaryLabel', label: 'Primary CTA label', type: 'text' },
      { name: 'heroPrimaryUrl', label: 'Primary CTA link', type: 'text' },
      { name: 'heroSecondaryLabel', label: 'Secondary CTA label', type: 'text' },
      { name: 'heroSecondaryUrl', label: 'Secondary CTA link', type: 'text' },
      { name: 'heroImage', label: 'Hero image URL', type: 'text' },
      { name: 'heroSpotlightEyebrow', label: 'Hero image eyebrow', type: 'text' },
      { name: 'heroSpotlightTitle', label: 'Hero image caption', type: 'text' }
    ]
  },
  {
    title: 'Featured products section',
    description: 'Customize the copy that introduces the featured product grid.',
    fields: [
      { name: 'featuredEyebrow', label: 'Eyebrow text', type: 'text' },
      { name: 'featuredTitle', label: 'Section title', type: 'text' },
      { name: 'featuredDescription', label: 'Section description', type: 'textarea' }
    ]
  },
  {
    title: 'Spotlight call-to-action',
    description: 'Update the messaging in the call-to-action band at the bottom of the home page.',
    fields: [
      { name: 'spotlightEyebrow', label: 'Eyebrow text', type: 'text' },
      { name: 'spotlightTitle', label: 'Headline', type: 'text' },
      { name: 'spotlightDescription', label: 'Description', type: 'textarea' },
      { name: 'spotlightCtaLabel', label: 'CTA label', type: 'text' },
      { name: 'spotlightCtaUrl', label: 'CTA link', type: 'text' }
    ]
  }
];

export default function SiteContentEditor({ content, onSubmit, password, loading, error }) {
  const [formState, setFormState] = useState(content);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState(content);
  }, [content]);

  const hasChanges = useMemo(() => JSON.stringify(formState) !== JSON.stringify(content), [formState, content]);

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
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
      setStatus({ type: 'success', message: 'Site content updated successfully.' });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update site content.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormState(content);
    setStatus(null);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Home page</p>
        <h2 className="text-2xl font-semibold text-slate-900">Site content editor</h2>
        <p className="text-sm text-slate-500">
          Update the hero, featured products introduction, and spotlight call-to-action to keep messaging fresh without redeploying the site.
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          Unable to load the latest content. Saving changes will overwrite the stored values.
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
      <form onSubmit={handleSubmit} className="space-y-10">
        {fieldGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
              <p className="text-sm text-slate-500">{group.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => {
                const value = formState[field.name] ?? '';
                const commonProps = {
                  id: field.name,
                  name: field.name,
                  value,
                  onChange: (event) => handleChange(field.name, event.target.value),
                  className:
                    'w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40'
                };
                return (
                  <label key={field.name} htmlFor={field.name} className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea rows={3} {...commonProps} />
                    ) : (
                      <input type="text" {...commonProps} />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !hasChanges}
            className="rounded-full bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Saving changes…' : 'Save updates'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || !hasChanges}
            className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 disabled:opacity-60"
          >
            Reset
          </button>
          {loading ? <span className="text-sm text-slate-500">Loading latest site content…</span> : null}
        </div>
      </form>
    </section>
  );
}
