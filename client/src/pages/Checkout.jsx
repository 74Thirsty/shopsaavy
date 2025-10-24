import { useMemo } from 'react';
import { useCheckoutConfig } from '../context/CheckoutConfigContext.jsx';

function buildEmbeddedUrl(url, provider) {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
    const parsed = new URL(url, base);
    if (provider === 'google') {
      const hasQuery = parsed.search.length > 0;
      parsed.search += `${hasQuery ? '&' : '?'}embedded=true`;
      return parsed.toString();
    }

    if (provider === 'microsoft') {
      const hasQuery = parsed.search.length > 0;
      parsed.search += `${hasQuery ? '&' : '?'}embed=true`;
      return parsed.toString();
    }
  } catch (_error) {
    return url;
  }

  return url;
}

function CheckoutFormEmbed({ title, url, provider }) {
  const embeddedUrl = useMemo(() => buildEmbeddedUrl(url, provider), [url, provider]);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">
          Share this link with customers who prefer lightweight order forms. Responses are captured in your {provider} account.
        </p>
      </div>
      <div className="space-x-4">
        <a
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open form
        </a>
        <code className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{url}</code>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <iframe title={title} src={embeddedUrl} className="h-[600px] w-full" loading="lazy" />
      </div>
    </div>
  );
}

export default function Checkout() {
  const { config, loading, error } = useCheckoutConfig();

  if (loading) {
    return <p className="text-slate-500">Loading checkout options...</p>;
  }

  if (error) {
    return <p className="text-red-500">Unable to load checkout options right now. Please try again later.</p>;
  }

  const {
    secureCheckoutLabel,
    secureCheckoutUrl,
    googleFormUrl,
    microsoftFormUrl,
    instructions
  } = config;

  const hasBudgetForms = Boolean(googleFormUrl || microsoftFormUrl);

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout hub</p>
        <h1 className="text-4xl font-semibold text-slate-900">Route customers to the right checkout experience</h1>
        <p className="max-w-3xl text-slate-600">
          {instructions ||
            'Offer a best-in-class secure checkout alongside budget-friendly order form workflows. Configure your preferred destinations in the admin panel.'}
        </p>
      </header>

      {secureCheckoutUrl ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">{secureCheckoutLabel || 'Secure checkout'}</h2>
              <p className="text-slate-600">
                Send shoppers to a PCI-compliant payment flow such as Stripe Checkout, Square Online Checkout, or another provider
                that fits your stack.
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand/30 transition hover:bg-brand-dark"
              href={secureCheckoutUrl}
              target="_blank"
              rel="noreferrer"
            >
              Continue to secure checkout
            </a>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          <p>Add a secure checkout URL in the admin panel to feature it here.</p>
        </section>
      )}

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Budget-friendly order forms</h2>
          <p className="text-slate-600">
            These embedded forms are perfect for teams that want to validate demand or capture manual invoices without investing in
            a full payment processor.
          </p>
        </div>

        {hasBudgetForms ? (
          <div className="space-y-6">
            {googleFormUrl ? (
              <CheckoutFormEmbed title="Google Forms order request" url={googleFormUrl} provider="google" />
            ) : null}
            {microsoftFormUrl ? (
              <CheckoutFormEmbed title="Microsoft Forms order request" url={microsoftFormUrl} provider="microsoft" />
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <p>Add a Google or Microsoft form link in the admin panel to embed it here for budget-conscious customers.</p>
          </div>
        )}
      </section>
    </div>
  );
}
