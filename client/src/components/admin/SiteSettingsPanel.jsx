import { useEffect, useMemo, useRef, useState } from 'react';

export default function SiteSettingsPanel({
  siteName,
  onSubmit,
  password,
  loading,
  error,
  layout,
  layoutOptions,
  onLayoutChange,
  theme,
  themeOptions,
  onThemeToggle
}) {
  const [value, setValue] = useState(siteName ?? '');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(layout ?? layoutOptions?.[0]?.value ?? 'classic');
  const previousTheme = useRef(theme);

  useEffect(() => {
    setValue(siteName ?? '');
  }, [siteName]);

  useEffect(() => {
    setSelectedLayout(layout ?? layoutOptions?.[0]?.value ?? 'classic');
  }, [layout, layoutOptions]);

  useEffect(() => {
    if (!status) return undefined;
    const timeout = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (previousTheme.current && theme && previousTheme.current !== theme) {
      const themeLabel = themeOptions?.find((option) => option.value === theme)?.label ?? theme;
      setStatus({ type: 'info', message: `Theme changed to ${themeLabel}` });
    }
    previousTheme.current = theme;
  }, [theme, themeOptions]);

  const hasChanges = useMemo(() => (value ?? '') !== (siteName ?? ''), [value, siteName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) {
      setStatus({ type: 'error', message: 'Provide the admin password to save changes.' });
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setStatus({ type: 'error', message: 'Site name cannot be empty.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);
      const updated = await onSubmit(trimmed, password);
      setValue(updated.siteName ?? trimmed);
      setStatus({ type: 'success', message: 'Site name updated successfully.' });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update site name.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setValue(siteName ?? '');
    setStatus(null);
  };

  const handleLayoutSelect = (event) => {
    const nextLayout = event.target.value;
    const layoutLabel = layoutOptions?.find((option) => option.value === nextLayout)?.label ?? nextLayout;
    setSelectedLayout(nextLayout);
    if (onLayoutChange) {
      onLayoutChange(nextLayout);
    }
    setStatus({ type: 'info', message: `Layout switched to ${layoutLabel}` });
  };

  const activeThemeLabel = useMemo(
    () => themeOptions?.find((option) => option.value === theme)?.label ?? theme,
    [themeOptions, theme]
  );

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Brand settings</p>
        <h2 className="text-2xl font-semibold text-slate-900">Site identity</h2>
        <p className="text-sm text-slate-500">
          Update the storefront name. Changes are applied instantly across the site and persisted to environment variables.
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          Unable to load the latest site name. Saving will overwrite the stored value.
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <label htmlFor="siteName" className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Site name</span>
          <input
            id="siteName"
            name="siteName"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Enter the storefront name"
            aria-describedby="site-name-description"
          />
        </label>
        <p id="site-name-description" className="text-xs text-slate-500">
          This updates the navigation header and saves the value to the `.env` file so deployments stay in sync.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || (!hasChanges && !error)}
            className="rounded-full bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save site name'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || (!hasChanges && !error)}
            className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 disabled:opacity-60"
          >
            Reset
          </button>
          {loading ? <span className="text-sm text-slate-500">Loading current site name…</span> : null}
        </div>
      </form>
      <div className="appearance-controls grid gap-5 rounded-2xl border border-slate-200 bg-white/60 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Layout template</p>
            <p className="text-sm text-slate-500">Choose how the storefront content is arranged on customer-facing pages.</p>
          </div>
          <select
            value={selectedLayout}
            onChange={handleLayoutSelect}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {(layoutOptions || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Color theme</p>
            <p className="text-sm text-slate-500">Cycle through curated palettes instantly. Current theme: {activeThemeLabel}.</p>
          </div>
          <button
            type="button"
            onClick={() => onThemeToggle?.()}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-dark"
          >
            Change theme
          </button>
        </div>
      </div>
    </section>
  );
}

