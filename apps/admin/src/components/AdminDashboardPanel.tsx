import { adminFetch } from '../lib/admin-fetch';
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ReceiptText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Order = {
  id: number;
  reference: string;
  status: string;
  subtotal: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
};

type Payment = {
  id: number;
  status: string;
  amount: number;
};

type Product = {
  id: number;
  status: string;
};

type Props = {
  onUnauthorized: () => void;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

function getOrderStatus(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'En attente',
        classes: 'bg-amber-50 text-amber-700',
      };
    case 'CONFIRMED':
      return {
        label: 'Confirmée',
        classes: 'bg-blue-50 text-blue-700',
      };
    case 'PROCESSING':
      return {
        label: 'En préparation',
        classes: 'bg-violet-50 text-violet-700',
      };
    case 'READY':
      return {
        label: 'Prête',
        classes: 'bg-cyan-50 text-cyan-700',
      };
    case 'COMPLETED':
      return {
        label: 'Terminée',
        classes: 'bg-emerald-50 text-emerald-700',
      };
    case 'CANCELLED':
      return {
        label: 'Annulée',
        classes: 'bg-red-50 text-red-700',
      };
    default:
      return {
        label: status,
        classes: 'bg-slate-100 text-slate-700',
      };
  }
}

export function AdminDashboardPanel({
  onUnauthorized,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchList<T>(path: string) {
      const response = await adminFetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        signal: controller.signal,
      });

      if (response.status === 401) {
        onUnauthorized();
        throw new Error('UNAUTHORIZED');
      }

      const payload =
        (await response.json()) as ApiResponse<T[]>;

      if (!response.ok) {
        throw new Error(
          payload.message ?? 'Impossible de charger les données.',
        );
      }

      return payload.data ?? [];
    }

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [ordersData, paymentsData, productsData] =
          await Promise.all([
            fetchList<Order>('/api/admin/orders'),
            fetchList<Payment>('/api/admin/payments'),
            fetchList<Product>(
              '/api/admin/catalog/products',
            ),
          ]);

        setOrders(ordersData);
        setPayments(paymentsData);
        setProducts(productsData);
      } catch (caught) {
        if (
          caught instanceof DOMException &&
          caught.name === 'AbortError'
        ) {
          return;
        }

        if (
          caught instanceof Error &&
          caught.message === 'UNAUTHORIZED'
        ) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger le tableau de bord.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [onUnauthorized]);

  const pendingOrders = orders.filter(
    (order) => order.status === 'PENDING',
  ).length;

  const paymentsToVerify = payments.filter(
    (payment) =>
      payment.status === 'SUBMITTED' ||
      payment.status === 'VERIFYING',
  ).length;

  const activeOrders = orders.filter((order) =>
    ['CONFIRMED', 'PROCESSING', 'READY'].includes(
      order.status,
    ),
  ).length;

  const publishedProducts = products.filter(
    (product) => product.status === 'PUBLISHED',
  ).length;

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const cards = [
    {
      title: 'Commandes en attente',
      value: pendingOrders,
      description: 'À prendre en charge',
      href: '/commandes',
      icon: Clock3,
    },
    {
      title: 'Paiements à vérifier',
      value: paymentsToVerify,
      description: 'Soumis ou en vérification',
      href: '/paiements',
      icon: CircleDollarSign,
    },
    {
      title: 'Commandes en cours',
      value: activeOrders,
      description: 'Confirmées à prêtes',
      href: '/commandes',
      icon: PackageCheck,
    },
    {
      title: 'Produits publiés',
      value: publishedProducts,
      description: 'Visibles sur la boutique',
      href: '/catalogue',
      icon: Boxes,
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))
          : cards.map(
              ({
                title,
                value,
                description,
                href,
                icon: Icon,
              }) => (
                <Link
                  key={title}
                  to={href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={21} />
                    </div>

                    <ArrowRight
                      size={17}
                      className="text-slate-300 transition group-hover:text-blue-600"
                    />
                  </div>

                  <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                    {value}
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {description}
                  </p>
                </Link>
              ),
            )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-950">
              Commandes récentes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dernières commandes enregistrées.
            </p>
          </div>

          <Link
            to="/commandes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
          >
            Toutes les commandes
            <ArrowRight size={16} />
          </Link>
        </div>

        {!isLoading && recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <ReceiptText
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              Aucune commande
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const status = getOrderStatus(order.status);

              return (
                <div
                  key={order.id}
                  className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[1.1fr_1fr_auto_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      {order.reference}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {order.customerName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {order.customerPhone}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
                  >
                    {status.label}
                  </span>

                  <p className="font-bold text-slate-950 md:text-right">
                    {formatPrice(order.subtotal)} FCFA
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
