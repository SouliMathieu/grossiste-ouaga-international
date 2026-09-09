import { adminFetch } from '../lib/admin-fetch';
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  SearchCheck,
  XCircle,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type Payment = {
  id: number;
  status: string;
  amount: number;
  currency: string;
  payerPhone: string | null;
  transactionId: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  method: {
    code: string;
    name: string;
    type: string;
  };
  order: {
    id: number;
    reference: string;
    status: string;
    customerName: string;
    customerPhone: string;
  };
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Filter =
  | 'ALL'
  | 'SUBMITTED'
  | 'VERIFYING'
  | 'PAID'
  | 'REJECTED';

type Props = {
  onUnauthorized: () => void;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'SUBMITTED':
      return 'Soumis';
    case 'VERIFYING':
      return 'En vérification';
    case 'PAID':
      return 'Payé';
    case 'REJECTED':
      return 'Rejeté';
    case 'REFUNDED':
      return 'Remboursé';
    case 'EXPIRED':
      return 'Expiré';
    default:
      return status;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700';
    case 'REJECTED':
      return 'bg-red-50 text-red-700';
    case 'VERIFYING':
      return 'bg-blue-50 text-blue-700';
    case 'SUBMITTED':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

const filters = [
  ['SUBMITTED', 'À vérifier'],
  ['VERIFYING', 'En vérification'],
  ['PAID', 'Payés'],
  ['REJECTED', 'Rejetés'],
  ['ALL', 'Tous'],
] as const;

export function PaymentsAdminPanel({
  onUnauthorized,
}: Props) {
  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [filter, setFilter] =
    useState<Filter>('SUBMITTED');

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [notes, setNotes] = useState<
    Record<number, string>
  >({});

  async function loadPayments() {
    setIsLoading(true);
    setError(null);

    try {
      const query =
        filter === 'ALL'
          ? ''
          : `?status=${encodeURIComponent(filter)}`;

      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/payments${query}`,
        {
          credentials: 'include',
        },
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const payload =
        (await response.json()) as ApiResponse<
          Payment[]
        >;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de récupérer les paiements.',
        );
      }

      setPayments(payload.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, [filter]);

  async function updatePaymentStatus(
    payment: Payment,
    status:
      | 'VERIFYING'
      | 'PAID'
      | 'REJECTED',
  ) {
    if (updatingId !== null) {
      return;
    }

    if (
      status === 'PAID' &&
      !window.confirm(
        `Confirmer le paiement de ${formatPrice(
          payment.amount,
        )} FCFA pour ${payment.order.reference} ?`,
      )
    ) {
      return;
    }

    if (
      status === 'REJECTED' &&
      !window.confirm(
        `Rejeter le paiement de ${payment.order.reference} ?`,
      )
    ) {
      return;
    }

    setUpdatingId(payment.id);
    setError(null);

    try {
      const note =
        notes[payment.id]?.trim();

      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/payments/${payment.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status,
            ...(note
              ? { adminNote: note }
              : {}),
          }),
        },
      );

      const payload =
        (await response.json()) as ApiResponse<unknown>;

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de modifier le paiement.',
        );
      }

      setNotes((current) => ({
        ...current,
        [payment.id]: '',
      }));

      await loadPayments();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                filter === value
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadPayments()}
          disabled={isLoading}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              isLoading ? 'animate-spin' : ''
            }
          />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ),
          )}
        </div>
      ) : payments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <SearchCheck
            size={30}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 font-bold text-slate-900">
            Aucun paiement
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aucun paiement ne correspond à ce filtre.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-bold text-blue-600">
                    {payment.order.reference}
                  </p>

                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    {formatPrice(payment.amount)}
                    <span className="ml-1 text-base">
                      FCFA
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {payment.method.name}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                    payment.status,
                  )}`}
                >
                  {getStatusLabel(
                    payment.status,
                  )}
                </span>
              </div>

              <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Client
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {
                      payment.order
                        .customerName
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      payment.order
                        .customerPhone
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Téléphone payeur
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {payment.payerPhone ??
                      '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Transaction
                  </p>

                  <p className="mt-1 break-all font-semibold text-slate-800">
                    {payment.transactionId ??
                      '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Soumis le
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(
                      payment.submittedAt,
                    )}
                  </p>
                </div>
              </div>

              {(payment.status ===
                'SUBMITTED' ||
                payment.status ===
                  'VERIFYING') && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Note administrateur
                    </span>

                    <textarea
                      rows={2}
                      value={
                        notes[payment.id] ??
                        ''
                      }
                      onChange={(event) =>
                        setNotes(
                          (current) => ({
                            ...current,
                            [payment.id]:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Note interne optionnelle..."
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {payment.status ===
                      'SUBMITTED' && (
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          payment.id
                        }
                        onClick={() =>
                          void updatePaymentStatus(
                            payment,
                            'VERIFYING',
                          )
                        }
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Clock3 size={17} />
                        Prendre en vérification
                      </button>
                    )}

                    {payment.status ===
                      'VERIFYING' && (
                      <>
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            payment.id
                          }
                          onClick={() =>
                            void updatePaymentStatus(
                              payment,
                              'PAID',
                            )
                          }
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2
                            size={17}
                          />
                          Valider payé
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            payment.id
                          }
                          onClick={() =>
                            void updatePaymentStatus(
                              payment,
                              'REJECTED',
                            )
                          }
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <XCircle size={17} />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {payment.adminNote && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <strong>Note :</strong>{' '}
                  {payment.adminNote}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
