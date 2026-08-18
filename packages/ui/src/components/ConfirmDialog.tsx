import type { PropsWithChildren } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel = 'Confirmer',
  onCancel,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      role="presentation"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-goi-lg bg-white p-6 shadow-goi-2"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-goi-navy">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-goi-slate">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
