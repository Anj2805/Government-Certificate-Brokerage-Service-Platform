const variants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 border-brand-700',
  secondary: 'bg-white text-brand-800 hover:bg-brand-50 border-brand-100',
  saffron: 'bg-saffron-600 text-white hover:bg-saffron-500 border-saffron-600',
  quiet: 'bg-transparent text-ink-700 hover:bg-ink-100 border-transparent',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-md border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
