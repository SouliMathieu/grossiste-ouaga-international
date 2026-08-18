import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  const descriptionId = inputId ? `${inputId}-description` : undefined;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-goi-navy" htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={`min-h-11 rounded-goi-sm border bg-white px-3 py-2.5 text-base text-goi-slate outline-none transition placeholder:text-slate-400 focus:border-goi-blue focus:ring-3 focus:ring-blue-100 ${error ? 'border-goi-danger' : 'border-slate-300'} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? descriptionId : undefined}
        {...props}
      />
      {error || hint ? (
        <span
          id={descriptionId}
          className={`text-xs ${error ? 'text-goi-danger' : 'text-goi-muted'}`}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
}
