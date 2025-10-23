import { useState } from 'react';

export default function AdminLogin({ onSubmit, checking, error }) {
  const [password, setPassword] = useState('');

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin access</p>
        <h1 className="text-3xl font-semibold text-slate-900">Enter the protected workspace</h1>
        <p className="text-slate-600">
          Use the admin password from your environment variables to unlock the no-code product management experience.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(password);
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Admin password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none"
          required
        />
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <button
          type="submit"
          disabled={checking}
          className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
        >
          {checking ? 'Verifying...' : 'Unlock admin panel'}
        </button>
      </form>
    </div>
  );
}
