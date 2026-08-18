import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({
  children,
  className = '',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-goi-md border border-slate-200 bg-white p-5 shadow-goi-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
