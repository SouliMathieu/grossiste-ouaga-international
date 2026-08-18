import { useState } from 'react';
import { Button } from './Button';

interface CopyFieldProps {
  label: string;
  value: string;
}

export function CopyField({ label, value }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-goi-muted">{label}</span>
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-goi-sm border border-slate-200 bg-goi-surface px-3 py-2">
        <strong className="break-all text-sm text-goi-navy">{value}</strong>
        <Button type="button" variant="ghost" className="shrink-0 px-3" onClick={copy}>
          {copied ? 'Copié' : 'Copier'}
        </Button>
      </div>
    </div>
  );
}
