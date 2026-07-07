export default function Input({ error, id, label, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-ink-800">
      {label}
      <input
        id={id}
        className={`mt-2 h-11 w-full rounded-md border border-civic-line bg-white px-3 text-sm text-ink-900 transition-colors placeholder:text-ink-500 focus:border-brand-700 ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <span id={`${id}-error`} className="mt-1 block text-sm text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
