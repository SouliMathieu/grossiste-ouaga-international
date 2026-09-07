import { OrdersAdminPanel } from '../components/OrdersAdminPanel';
import { PaymentAccountsAdminPanel } from '../components/PaymentAccountsAdminPanel';
import { CatalogAdminPanel } from '../components/CatalogAdminPanel';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type Admin = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

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

export function App() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isCheckingSession, setIsCheckingSession] =
    useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] =
    useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<Filter>('SUBMITTED');
  const [isLoadingPayments, setIsLoadingPayments] =
    useState(false);
  const [paymentsError, setPaymentsError] =
    useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] =
    useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/auth/me`,
          {
            credentials: 'include',
          },
        );

        if (!response.ok) {
          setAdmin(null);
          return;
        }

        const payload =
          (await response.json()) as ApiResponse<Admin>;

        if (payload.data) {
          setAdmin(payload.data);
        }
      } catch {
        setAdmin(null);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void checkSession();
  }, []);

  useEffect(() => {
    if (!admin) {
      return;
    }

    void loadPayments();
  }, [admin, filter]);

  async function loadPayments() {
    setIsLoadingPayments(true);
    setPaymentsError(null);

    try {
      const query =
        filter === 'ALL'
          ? ''
          : `?status=${encodeURIComponent(filter)}`;

      const response = await fetch(
        `${API_BASE_URL}/api/admin/payments${query}`,
        {
          credentials: 'include',
        },
      );

      if (response.status === 401) {
        setAdmin(null);
        return;
      }

      const payload =
        (await response.json()) as ApiResponse<Payment[]>;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de récupérer les paiements.',
        );
      }

      setPayments(payload.data ?? []);
    } catch (error) {
      setPaymentsError(
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoadingPayments(false);
    }
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/auth/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const payload =
        (await response.json()) as ApiResponse<Admin>;

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.message ??
            'Impossible de vous connecter.',
        );
      }

      setAdmin(payload.data);
      setPassword('');
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(
        `${API_BASE_URL}/api/admin/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
    } finally {
      setAdmin(null);
      setPayments([]);
    }
  }

  async function updatePaymentStatus(
    payment: Payment,
    status: 'VERIFYING' | 'PAID' | 'REJECTED',
  ) {
    if (updatingPaymentId) {
      return;
    }

    if (status === 'PAID') {
      const confirmed = window.confirm(
        `Confirmer le paiement de ${formatPrice(
          payment.amount,
        )} FCFA pour la commande ${
          payment.order.reference
        } ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (status === 'REJECTED') {
      const confirmed = window.confirm(
        `Rejeter le paiement de la commande ${payment.order.reference} ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingPaymentId(payment.id);
    setPaymentsError(null);

    try {
      const note = notes[payment.id]?.trim();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/payments/${payment.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            ...(note ? { adminNote: note } : {}),
          }),
        },
      );

      const payload =
        (await response.json()) as ApiResponse<unknown>;

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
    } catch (error) {
      setPaymentsError(
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="font-semibold text-slate-700">
          Vérification de la session...
        </p>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-8">
          <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            GOI Administration
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
            Connexion
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Accès réservé aux administrateurs autorisés.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">
                Email
              </span>

              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                disabled={isLoggingIn}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-blue-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">
                Mot de passe
              </span>

              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                disabled={isLoggingIn}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-blue-600"
              />
            </label>

            {loginError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="min-h-12 w-full rounded-lg bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn
                ? 'Connexion...'
                : 'Se connecter'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-lg font-extrabold text-slate-900">
              GOI Administration
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {admin.fullName} · {admin.role}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Paiements
            </h1>

            <p className="mt-2 text-slate-500">
              Vérification manuelle des paiements clients.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={isLoadingPayments}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Actualiser
          </button>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {(
            [
              ['SUBMITTED', 'À vérifier'],
              ['VERIFYING', 'En vérification'],
              ['PAID', 'Payés'],
              ['REJECTED', 'Rejetés'],
              ['ALL', 'Tous'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
                filter === value
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {paymentsError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {paymentsError}
          </div>
        )}

        {isLoadingPayments ? (
          <div className="mt-8 rounded-xl bg-white p-8">
            <p className="font-semibold text-slate-700">
              Chargement des paiements...
            </p>
          </div>
        ) : payments.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-8">
            <p className="font-semibold text-slate-800">
              Aucun paiement dans cette catégorie.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-xl bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {payment.order.reference}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {formatPrice(payment.amount)} FCFA
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {payment.method.name}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                      payment.status,
                    )}`}
                  >
                    {getStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Client
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {payment.order.customerName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.order.customerPhone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Téléphone payeur
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {payment.payerPhone ?? '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Transaction
                    </p>
                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {payment.transactionId ?? '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Soumis le
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(payment.submittedAt)}
                    </p>
                  </div>
                </div>

                {(payment.status === 'SUBMITTED' ||
                  payment.status === 'VERIFYING') && (
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Note administrateur
                      </span>

                      <textarea
                        rows={2}
                        value={notes[payment.id] ?? ''}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [payment.id]: event.target.value,
                          }))
                        }
                        placeholder="Note interne optionnelle..."
                        className="mt-2 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-600"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {payment.status === 'SUBMITTED' && (
                        <button
                          type="button"
                          disabled={
                            updatingPaymentId === payment.id
                          }
                          onClick={() =>
                            void updatePaymentStatus(
                              payment,
                              'VERIFYING',
                            )
                          }
                          className="min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Prendre en vérification
                        </button>
                      )}

                      {payment.status === 'VERIFYING' && (
                        <>
                          <button
                            type="button"
                            disabled={
                              updatingPaymentId === payment.id
                            }
                            onClick={() =>
                              void updatePaymentStatus(
                                payment,
                                'PAID',
                              )
                            }
                            className="min-h-11 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Valider payé
                          </button>

                          <button
                            type="button"
                            disabled={
                              updatingPaymentId === payment.id
                            }
                            onClick={() =>
                              void updatePaymentStatus(
                                payment,
                                'REJECTED',
                              )
                            }
                            className="min-h-11 rounded-lg border border-red-200 bg-white px-4 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {payment.adminNote && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    <strong>Note :</strong>{' '}
                    {payment.adminNote}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        <OrdersAdminPanel />
        <PaymentAccountsAdminPanel />
        <CatalogAdminPanel />
      </main>
    </div>
  );
}
