export default function SectionTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="section-title flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="section-title__copy max-w-2xl space-y-2">
        {eyebrow ? <p className="section-title__eyebrow text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p> : null}
        <h2 className="section-title__heading text-3xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="section-title__description text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="section-title__actions flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
