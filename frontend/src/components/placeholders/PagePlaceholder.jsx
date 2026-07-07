export default function PagePlaceholder({ title, description }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </section>
  );
}
