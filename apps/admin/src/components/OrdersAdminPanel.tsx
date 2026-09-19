import { adminFetch } from '../lib/admin-fetch';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

type OrderItem = {
  id: number;
  productId: number | null;
  name: string;
  sku: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type Order = {
  id: number;
  reference: string;
  status: OrderStatus;
  subtotal: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryMode: string;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  payment: {
    id: number;
    status: string;
    amount: number;
    payerPhone: string | null;
    transactionId: string | null;
    method: {
      code: string;
      name: string;
      type: string;
    };
  } | null;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type OrderFilter =
  | 'ALL'
  | OrderStatus;

type PaymentFilter =
  | 'ALL'
  | 'NONE'
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFYING'
  | 'PAID'
  | 'REJECTED'
  | 'REFUNDED'
  | 'EXPIRED';

const orderFilters: Array<{
  value: OrderFilter;
  label: string;
}> = [
  {
    value: 'ALL',
    label: 'Toutes',
  },
  {
    value: 'PENDING',
    label: 'En attente',
  },
  {
    value: 'CONFIRMED',
    label: 'Confirmées',
  },
  {
    value: 'PROCESSING',
    label: 'En préparation',
  },
  {
    value: 'READY',
    label: 'Prêtes',
  },
  {
    value: 'COMPLETED',
    label: 'Terminées',
  },
  {
    value: 'CANCELLED',
    label: 'Annulées',
  },
];

const paymentFilters: Array<{
  value: PaymentFilter;
  label: string;
}> = [
  {
    value: 'ALL',
    label: 'Tous les paiements',
  },
  {
    value: 'PENDING',
    label: 'Paiement en attente',
  },
  {
    value: 'SUBMITTED',
    label: 'Paiement soumis',
  },
  {
    value: 'VERIFYING',
    label: 'En vérification',
  },
  {
    value: 'PAID',
    label: 'Payé',
  },
  {
    value: 'REJECTED',
    label: 'Rejeté',
  },
  {
    value: 'REFUNDED',
    label: 'Remboursé',
  },
  {
    value: 'EXPIRED',
    label: 'Expiré',
  },
  {
    value: 'NONE',
    label: 'Sans paiement',
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(
    value,
  );

function formatAmount(
  value: number,
  currency: string,
) {
  return `${formatPrice(value)} ${
    currency === 'XOF'
      ? 'FCFA'
      : currency
  }`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

function getOrderStatusLabel(
  status: string,
) {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'CONFIRMED':
      return 'Confirmée';
    case 'PROCESSING':
      return 'En préparation';
    case 'READY':
      return 'Prête';
    case 'COMPLETED':
      return 'Terminée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return status;
  }
}

function getPaymentStatusLabel(
  status: string,
) {
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

function getOrderStatusClass(
  status: string,
) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'CONFIRMED':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'PROCESSING':
      return 'bg-violet-50 text-violet-700 ring-violet-200';
    case 'READY':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 ring-red-200';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200';
  }
}

function getPaymentStatusClass(
  status?: string,
) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'SUBMITTED':
    case 'VERIFYING':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'REJECTED':
    case 'EXPIRED':
      return 'bg-red-50 text-red-700 ring-red-200';
    case 'REFUNDED':
      return 'bg-violet-50 text-violet-700 ring-violet-200';
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-200';
  }
}

function getItemCount(
  order: Order,
) {
  return order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );
}

function canConfirmOrder(
  order: Order,
) {
  return (
    order.payment?.method.type ===
      'CASH' ||
    order.payment?.status === 'PAID'
  );
}

function getNextActions(order: Order) {
  if (order.status === 'PENDING') {
    return canConfirmOrder(order)
      ? ([
          ['CONFIRMED', 'Confirmer'],
          ['CANCELLED', 'Annuler'],
        ] as const)
      : ([
          ['CANCELLED', 'Annuler'],
        ] as const);
  }

  if (order.status === 'CONFIRMED') {
    return [
      [
        'PROCESSING',
        'Mettre en préparation',
      ],
      ['CANCELLED', 'Annuler'],
    ] as const;
  }

  if (order.status === 'PROCESSING') {
    return [
      ['READY', 'Marquer prête'],
      ['CANCELLED', 'Annuler'],
    ] as const;
  }

  if (order.status === 'READY') {
    return [
      ['COMPLETED', 'Terminer'],
    ] as const;
  }

  return [] as const;
}

export function OrdersAdminPanel() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState<number | null>(null);

  const [
    orderFilter,
    setOrderFilter,
  ] = useState<OrderFilter>('ALL');

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState<PaymentFilter>('ALL');

  async function loadOrders() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/orders`,
        {
          credentials: 'include',
        },
      );

      const payload =
        (await response.json()) as
          ApiResponse<Order[]>;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de récupérer les commandes.',
        );
      }

      setOrders(payload.data ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const statistics = useMemo(
    () => ({
      total: orders.length,

      active: orders.filter((order) =>
        [
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
        ].includes(order.status),
      ).length,

      ready: orders.filter(
        (order) =>
          order.status === 'READY',
      ).length,

      paymentsToVerify: orders.filter(
        (order) =>
          order.payment?.status ===
            'SUBMITTED' ||
          order.payment?.status ===
            'VERIFYING',
      ).length,
    }),
    [orders],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesOrder =
          orderFilter === 'ALL' ||
          order.status === orderFilter;

        const matchesPayment =
          paymentFilter === 'ALL' ||
          (
            paymentFilter === 'NONE'
              ? !order.payment
              : order.payment?.status ===
                paymentFilter
          );

        return (
          matchesOrder &&
          matchesPayment
        );
      }),
    [
      orders,
      orderFilter,
      paymentFilter,
    ],
  );

  function getFilterCount(
    status: OrderFilter,
  ) {
    if (status === 'ALL') {
      return orders.length;
    }

    return orders.filter(
      (order) =>
        order.status === status,
    ).length;
  }

  async function updateStatus(
    order: Order,
    status: OrderStatus,
  ) {
    if (updatingId !== null) {
      return;
    }

    if (
      status === 'CANCELLED' &&
      !window.confirm(
        `Annuler ${order.reference} ?`,
      )
    ) {
      return;
    }

    setUpdatingId(order.id);
    setError(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/orders/${order.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          ApiResponse<unknown> | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible de modifier la commande.',
        );
      }

      await loadOrders();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Gestion des commandes
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Suivez chaque commande depuis
            sa création jusqu’à sa
            finalisation, tout en gardant
            le statut du paiement séparé.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadOrders()
          }
          disabled={isLoading}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          {isLoading
            ? 'Actualisation...'
            : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {statistics.total}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Commandes enregistrées
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            À traiter
          </p>

          <p className="mt-2 text-3xl font-black text-blue-900">
            {statistics.active}
          </p>

          <p className="mt-1 text-sm text-blue-700/70">
            Attente, confirmées ou en
            préparation
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
            Prêtes
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {statistics.ready}
          </p>

          <p className="mt-1 text-sm text-cyan-700/70">
            À remettre ou livrer
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Paiements à vérifier
          </p>

          <p className="mt-2 text-3xl font-black text-amber-900">
            {
              statistics.paymentsToVerify
            }
          </p>

          <p className="mt-1 text-sm text-amber-700/70">
            Soumis ou en vérification
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Statut de la commande
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {orderFilters.map(
                (filter) => {
                  const active =
                    orderFilter ===
                    filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() =>
                        setOrderFilter(
                          filter.value,
                        )
                      }
                      className={[
                        'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {filter.label}

                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {getFilterCount(
                          filter.value,
                        )}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <label className="min-w-[230px]">
              <span className="text-sm font-bold text-slate-900">
                Statut du paiement
              </span>

              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(
                    event.target
                      .value as PaymentFilter,
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                {paymentFilters.map(
                  (filter) => (
                    <option
                      key={filter.value}
                      value={filter.value}
                    >
                      {filter.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            {(orderFilter !== 'ALL' ||
              paymentFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setOrderFilter('ALL');
                  setPaymentFilter('ALL');
                }}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            )}

            <p className="ml-auto text-sm text-slate-500">
              {filteredOrders.length}{' '}
              commande
              {filteredOrders.length !== 1
                ? 's'
                : ''}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Chargement des commandes...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-bold text-slate-900">
            Aucune commande
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Aucune commande ne correspond
            aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(
            (order) => {
              const isOpen =
                selectedOrderId ===
                order.id;

              const actions =
                getNextActions(order);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-blue-600">
                            {
                              order.reference
                            }
                          </p>

                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                              getOrderStatusClass(
                                order.status,
                              ),
                            ].join(' ')}
                          >
                            {getOrderStatusLabel(
                              order.status,
                            )}
                          </span>

                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                              getPaymentStatusClass(
                                order.payment
                                  ?.status,
                              ),
                            ].join(' ')}
                          >
                            Paiement :{' '}
                            {order.payment
                              ? getPaymentStatusLabel(
                                  order
                                    .payment
                                    .status,
                                )
                              : 'Non renseigné'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-950">
                          {
                            order.customerName
                          }
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {
                              order.customerPhone
                            }
                          </a>

                          <span>
                            {formatDate(
                              order.createdAt,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                        <div className="mr-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-black text-slate-950">
                            {formatAmount(
                              order.subtotal,
                              order.currency,
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrderId(
                              isOpen
                                ? null
                                : order.id,
                            )
                          }
                          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {isOpen
                            ? 'Masquer le détail'
                            : 'Voir le détail'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Livraison
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {order.deliveryMode ===
                          'DELIVERY'
                            ? 'Livraison'
                            : 'Retrait'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Articles
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {getItemCount(
                            order,
                          )}{' '}
                          article
                          {getItemCount(
                            order,
                          ) !== 1
                            ? 's'
                            : ''}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Moyen de paiement
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {order.payment
                            ?.method.name ??
                            '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="font-bold text-slate-950">
                            Client
                          </h4>

                          <dl className="mt-4 space-y-3 text-sm">
                            <div>
                              <dt className="text-slate-400">
                                Nom
                              </dt>

                              <dd className="mt-1 font-semibold text-slate-800">
                                {
                                  order.customerName
                                }
                              </dd>
                            </div>

                            <div>
                              <dt className="text-slate-400">
                                Téléphone
                              </dt>

                              <dd className="mt-1">
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="font-semibold text-blue-600"
                                >
                                  {
                                    order.customerPhone
                                  }
                                </a>
                              </dd>
                            </div>

                            {order.customerEmail && (
                              <div>
                                <dt className="text-slate-400">
                                  Email
                                </dt>

                                <dd className="mt-1 break-all font-semibold text-slate-800">
                                  {
                                    order.customerEmail
                                  }
                                </dd>
                              </div>
                            )}
                          </dl>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="font-bold text-slate-950">
                            Livraison
                          </h4>

                          <dl className="mt-4 space-y-3 text-sm">
                            <div>
                              <dt className="text-slate-400">
                                Mode
                              </dt>

                              <dd className="mt-1 font-semibold text-slate-800">
                                {order.deliveryMode ===
                                'DELIVERY'
                                  ? 'Livraison'
                                  : 'Retrait'}
                              </dd>
                            </div>

                            {order.deliveryAddress && (
                              <div>
                                <dt className="text-slate-400">
                                  Adresse
                                </dt>

                                <dd className="mt-1 leading-6 text-slate-700">
                                  {
                                    order.deliveryAddress
                                  }
                                </dd>
                              </div>
                            )}
                          </dl>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-950">
                              Paiement
                            </h4>

                            {order.payment && (
                              <span
                                className={[
                                  'rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                                  getPaymentStatusClass(
                                    order
                                      .payment
                                      .status,
                                  ),
                                ].join(
                                  ' ',
                                )}
                              >
                                {getPaymentStatusLabel(
                                  order
                                    .payment
                                    .status,
                                )}
                              </span>
                            )}
                          </div>

                          {order.payment ? (
                            <dl className="mt-4 space-y-3 text-sm">
                              <div>
                                <dt className="text-slate-400">
                                  Moyen
                                </dt>

                                <dd className="mt-1 font-semibold text-slate-800">
                                  {
                                    order
                                      .payment
                                      .method
                                      .name
                                  }
                                </dd>
                              </div>

                              <div>
                                <dt className="text-slate-400">
                                  Montant
                                </dt>

                                <dd className="mt-1 font-semibold text-slate-800">
                                  {formatAmount(
                                    order
                                      .payment
                                      .amount,
                                    order.currency,
                                  )}
                                </dd>
                              </div>

                              {order.payment
                                .payerPhone && (
                                <div>
                                  <dt className="text-slate-400">
                                    Téléphone payeur
                                  </dt>

                                  <dd className="mt-1 font-semibold text-slate-800">
                                    {
                                      order
                                        .payment
                                        .payerPhone
                                    }
                                  </dd>
                                </div>
                              )}

                              {order.payment
                                .transactionId && (
                                <div>
                                  <dt className="text-slate-400">
                                    Transaction ID
                                  </dt>

                                  <dd className="mt-1 break-all font-mono font-semibold text-slate-800">
                                    {
                                      order
                                        .payment
                                        .transactionId
                                    }
                                  </dd>
                                </div>
                              )}
                            </dl>
                          ) : (
                            <p className="mt-4 text-sm text-slate-500">
                              Aucun paiement
                              associé.
                            </p>
                          )}
                        </section>
                      </div>

                      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h4 className="font-bold text-slate-950">
                            Articles commandés
                          </h4>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {order.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">
                                    {
                                      item.name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    SKU :{' '}
                                    {
                                      item.sku
                                    }{' '}
                                    · Quantité :{' '}
                                    {
                                      item.quantity
                                    }{' '}
                                    {item.unit}
                                  </p>
                                </div>

                                <div className="sm:text-right">
                                  <p className="font-bold text-slate-900">
                                    {formatAmount(
                                      item.lineTotal,
                                      order.currency,
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatAmount(
                                      item.unitPrice,
                                      order.currency,
                                    )}{' '}
                                    / unité
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="flex justify-between gap-4 border-t border-slate-200 bg-slate-50 px-4 py-4">
                          <span className="font-bold text-slate-700">
                            Total commande
                          </span>

                          <strong className="text-slate-950">
                            {formatAmount(
                              order.subtotal,
                              order.currency,
                            )}
                          </strong>
                        </div>
                      </section>

                      {order.notes && (
                        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="font-bold text-slate-950">
                            Notes du client
                          </h4>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {order.notes}
                          </p>
                        </section>
                      )}

                      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              Gestion de la
                              commande
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Statut actuel :{' '}
                              <strong>
                                {getOrderStatusLabel(
                                  order.status,
                                )}
                              </strong>
                            </p>
                          </div>

                          {actions.length >
                          0 ? (
                            <div className="flex flex-wrap gap-2">
                              {actions.map(
                                ([
                                  status,
                                  label,
                                ]) => (
                                  <button
                                    key={
                                      status
                                    }
                                    type="button"
                                    disabled={
                                      updatingId !==
                                      null
                                    }
                                    onClick={() =>
                                      void updateStatus(
                                        order,
                                        status,
                                      )
                                    }
                                    className={
                                      status ===
                                      'CANCELLED'
                                        ? 'min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60'
                                        : 'min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60'
                                    }
                                  >
                                    {updatingId ===
                                    order.id
                                      ? 'Mise à jour...'
                                      : label}
                                  </button>
                                ),
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-slate-500">
                              Aucune action
                              supplémentaire.
                            </p>
                          )}
                        </div>

                        {order.status ===
                          'PENDING' &&
                          !canConfirmOrder(
                            order,
                          ) && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                              Cette commande ne
                              peut pas encore être
                              confirmée : le
                              paiement doit
                              d’abord être validé,
                              sauf pour un
                              paiement en espèces.
                            </div>
                          )}
                      </section>
                    </div>
                  )}
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
