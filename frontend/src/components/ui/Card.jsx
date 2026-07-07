export function Card({ as: Component = 'article', className = '', children, ...props }) {
  return (
    <Component
      className={`rounded-lg border border-civic-line bg-white p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3 className="mt-2 text-xl font-semibold leading-snug text-ink-900">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p> : null}
    </div>
  );
}
