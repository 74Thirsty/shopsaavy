export default function SectionTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
