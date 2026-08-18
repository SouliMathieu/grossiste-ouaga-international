import type { PaymentStatus } from '@goi/types';
import { Badge } from './Badge';

const config: Record<
  PaymentStatus,
  { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'En attente', tone: 'neutral' },
  SUBMITTED: { label: 'Soumis', tone: 'info' },
  VERIFYING: { label: 'En vérification', tone: 'warning' },
  PAID: { label: 'Payé', tone: 'success' },
  REJECTED: { label: 'Rejeté', tone: 'danger' },
  REFUNDED: { label: 'Remboursé', tone: 'neutral' },
  EXPIRED: { label: 'Expiré', tone: 'danger' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const item = config[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
