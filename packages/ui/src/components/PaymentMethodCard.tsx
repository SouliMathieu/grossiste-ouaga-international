import type { PaymentMethod } from '@goi/types';
import { Badge } from './Badge';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected?: boolean;
  onSelect?: (code: PaymentMethod['code']) => void;
}

export function PaymentMethodCard({ method, selected = false, onSelect }: PaymentMethodCardProps) {
  const manual = method.verificationMode === 'MANUAL';

  return (
    <button
      type="button"
      className={`grid w-full grid-cols-[auto_1fr] gap-3 rounded-goi-md border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-goi-blue ${selected ? 'border-goi-blue bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'} ${method.enabled ? '' : 'cursor-not-allowed opacity-50'}`}
      aria-pressed={selected}
      disabled={!method.enabled}
      onClick={() => onSelect?.(method.code)}
    >
      <span
        className={`mt-1 size-4 rounded-full border-4 ${selected ? 'border-goi-blue bg-white' : 'border-slate-300 bg-white'}`}
        aria-hidden="true"
      />
      <span className="grid gap-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-goi-navy">
          {method.name}
          {manual ? <Badge tone="warning">Validation manuelle</Badge> : null}
        </span>
        <span className="text-sm font-normal text-goi-muted">{method.description}</span>
      </span>
    </button>
  );
}
