import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    loading?: boolean;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-goi-blue text-white hover:bg-blue-700 focus-visible:outline-goi-blue disabled:bg-slate-300',
  secondary:
    'border border-slate-300 bg-white text-goi-navy hover:bg-goi-surface focus-visible:outline-goi-blue',
  ghost: 'bg-transparent text-goi-navy hover:bg-goi-surface focus-visible:outline-goi-blue',
  danger:
    'bg-goi-danger text-white hover:bg-red-800 focus-visible:outline-goi-danger disabled:bg-slate-300',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-goi-sm px-4 py-2.5 text-sm font-semibold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span aria-hidden="true">•••</span> : null}
      <span>{children}</span>
    </button>
  );
}
