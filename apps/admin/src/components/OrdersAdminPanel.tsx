import { adminFetch } from '../lib/admin-fetch';
import {
  useEffect,
  useState,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

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
  status: string;
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

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);

function getOrderStatusLabel(status: string) {
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

function getNextActions(order: Order) {
  if (order.status === 'PENDING') {
    const canConfirm =
      order.payment?.method.type === 'CASH' ||
      order.payment?.status === 'PAID';

    return canConfirm
      ? ([
          ['CONFIRMED', 'Confirmer'],
          ['CANCELLED', 'Annuler'],
        ] as const)
      : ([['CANCELLED', 'Annuler']] as const);
  }

  if (order.status === 'CONFIRMED') {
    return [
      ['PROCESSING', 'Mettre en préparation'],
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

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

  async function updateStatus(
    order: Order,
    status: string,
  ) {
    if (updatingId) {
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
            'Content-Type': 'application/json',
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>

          <h2 className="text-xl font-bold text-slate-950">
            Liste des commandes
          </h2>

          <p className="mt-2 text-slate-500">
            Suivez la préparation, le retrait et la
            livraison des commandes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 font-semibold"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-7 rounded-xl bg-white p-6">
          Chargement des commandes...
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {order.reference}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {order.customerName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {order.customerPhone}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {formatPrice(order.subtotal)} FCFA
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {getOrderStatusLabel(order.status)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Livraison
                  </p>

                  <p className="mt-1 font-semibold">
                    {order.deliveryMode ===
                    'DELIVERY'
                      ? 'Livraison'
                      : 'Retrait'}
                  </p>

                  {order.deliveryAddress && (
                    <p className="mt-1 text-sm text-slate-500">
                      {order.deliveryAddress}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Paiement
                  </p>

                  <p className="mt-1 font-semibold">
                    {order.payment?.method.name ??
                      '—'}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {order.payment?.status ?? '—'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Articles
                  </p>

                  <p className="mt-1 font-semibold">
                    {order.items.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 p-3 text-sm"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>

                    <strong>
                      {formatPrice(item.lineTotal)} FCFA
                    </strong>
                  </div>
                ))}
              </div>

              {getNextActions(order).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {getNextActions(order).map(
                    ([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        disabled={
                          updatingId === order.id
                        }
                        onClick={() =>
                          void updateStatus(
                            order,
                            status,
                          )
                        }
                        className={
                          status === 'CANCELLED'
                            ? 'min-h-11 rounded-lg border border-red-200 px-4 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60'
                            : 'min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60'
                        }
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
