import {
  Check,
  Copy,
  CreditCard,
  LockKeyhole,
  Package,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import { PaymentSubmissionForm } from '../components/payment/PaymentSubmissionForm';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

type PaymentAccount = {
  accountName?: string | null;
  accountNumber?: string | null;
  merchantCode?: string | null;
  actionUrl?: string | null;
  ussdTemplate?: string | null;
};

type PaymentMethod = {
  code: string;
  name: string;
  type: string;
  instructions?: string | null;
  account: PaymentAccount | null;
};

type Payment = {
  id: number;
  status: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
};

type OrderItem = {
  productId: number;
  name: string;
  sku: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type Order = {
  reference: string;
  status: string;
  subtotal: number;
  currency: string;
  createdAt: string;
  deliveryMode: string;
  payment: Payment | null;
  items: OrderItem[];
};

type OrderResponse = {
  data?: Order;
  message?: string;
};

type CopiedField =
  | 'reference'
  | 'amount'
  | 'accountNumber'
  | null;

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return 'En attente de paiement';
    case 'SUBMITTED':
      return 'Paiement soumis';
    case 'VERIFYING':
      return 'En cours de vérification';
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

function getPaymentStatusClasses(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-goi-emerald';
    case 'REJECTED':
    case 'EXPIRED':
      return 'bg-red-50 text-goi-danger';
    case 'SUBMITTED':
    case 'VERIFYING':
      return 'bg-blue-50 text-goi-blue';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

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

export function PaymentPage() {
  const { reference } = useParams();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [copiedField, setCopiedField] =
    useState<CopiedField>(null);

  const [copyError, setCopyError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoadError(
        'La référence de commande est invalide.',
      );
      setIsLoading(false);
      return;
    }

    const orderReference = reference;
    const controller = new AbortController();

    async function loadOrder() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/orders/${encodeURIComponent(orderReference)}`,
          {
            signal: controller.signal,
          },
        );

        const payload = (await response
          .json()
          .catch(
            () => null,
          )) as OrderResponse | null;

        if (!response.ok) {
          throw new Error(
            payload?.message ??
              'Impossible de récupérer cette commande.',
          );
        }

        if (!payload?.data) {
          throw new Error(
            'Les informations de la commande sont indisponibles.',
          );
        }

        setOrder(payload.data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder();

    return () => controller.abort();
  }, [reference]);

  async function copyValue(
    value: string,
    field: Exclude<CopiedField, null>,
  ) {
    try {
      await navigator.clipboard.writeText(value);

      setCopyError(null);
      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField((current) =>
          current === field ? null : current,
        );
      }, 1800);
    } catch {
      setCopiedField(null);
      setCopyError(
        'La copie automatique a échoué. Sélectionnez la valeur manuellement.',
      );
    }
  }

  if (isLoading) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="bg-goi-surface py-12">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
            <div className="h-[560px] animate-pulse rounded-2xl bg-white" />
            <div className="h-[400px] animate-pulse rounded-2xl bg-white" />
          </div>
        </main>

        <SiteFooter />
      </>
    );
  }

  if (loadError || !order) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="bg-goi-surface py-16">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h1 className="text-3xl font-extrabold text-goi-navy">
                Impossible d’afficher la commande
              </h1>

              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-goi-danger"
              >
                {loadError}
              </div>

              <Link
                to="/produits"
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-goi-blue px-5 font-semibold text-white"
              >
                Retour au catalogue
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </>
    );
  }

  const payment = order.payment;

  const isCash =
    payment?.method.type === 'CASH';

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-goi-surface py-8 sm:py-10">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-goi-emerald text-white">
                <Check size={20} />
              </div>

              <div>
                <p className="font-bold text-goi-navy">
                  Commande enregistrée
                </p>

                <p className="mt-1 text-sm text-goi-muted">
                  Votre référence est{' '}
                  <strong>{order.reference}</strong>.
                  Conservez-la pour le suivi.
                </p>
              </div>
            </div>

            <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-goi-slate sm:mt-0">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                      {isCash
                        ? 'Commande confirmée'
                        : 'Paiement'}
                    </p>

                    <h1 className="mt-2 text-3xl font-black tracking-tight text-goi-navy">
                      {isCash
                        ? 'Votre commande est enregistrée'
                        : 'Effectuer votre paiement'}
                    </h1>
                  </div>

                  {payment && (
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${getPaymentStatusClasses(payment.status)}`}
                    >
                      {getPaymentStatusLabel(
                        payment.status,
                      )}
                    </span>
                  )}
                </div>

                {payment ? (
                  <>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-goi-navy p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Montant
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {formatPrice(
                            payment.amount,
                          )}
                          <span className="ml-1 text-lg">
                            FCFA
                          </span>
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void copyValue(
                              String(
                                payment.amount,
                              ),
                              'amount',
                            )
                          }
                          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold transition hover:bg-white/10"
                        >
                          {copiedField ===
                          'amount' ? (
                            <>
                              <Check size={15} />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy size={15} />
                              Copier le montant
                            </>
                          )}
                        </button>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                          Référence
                        </p>

                        <p className="mt-2 break-all text-xl font-extrabold text-goi-navy">
                          {order.reference}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void copyValue(
                              order.reference,
                              'reference',
                            )
                          }
                          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-goi-surface px-3 text-xs font-semibold text-goi-navy"
                        >
                          {copiedField ===
                          'reference' ? (
                            <>
                              <Check size={15} />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy size={15} />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {copyError && (
                      <div
                        role="alert"
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-goi-danger"
                      >
                        {copyError}
                      </div>
                    )}

                    <div className="mt-7 border-t border-slate-200 pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-goi-blue/10 text-goi-blue">
                          <CreditCard size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                            Moyen choisi
                          </p>

                          <h2 className="mt-1 text-xl font-bold text-goi-navy">
                            {payment.method.name}
                          </h2>
                        </div>
                      </div>

                      <p className="mt-4 leading-7 text-goi-muted">
                        {payment.method.instructions ??
                          'Suivez les instructions communiquées par GOI pour effectuer votre paiement.'}
                      </p>
                    </div>

                    {payment.method.account && (
                      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                        <p className="text-sm font-bold text-goi-navy">
                          Informations de paiement
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {payment.method.account
                            .accountName && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                                Bénéficiaire
                              </p>

                              <p className="mt-1 font-bold text-goi-navy">
                                {
                                  payment.method
                                    .account
                                    .accountName
                                }
                              </p>
                            </div>
                          )}

                          {payment.method.account
                            .merchantCode && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                                Code marchand
                              </p>

                              <p className="mt-1 font-bold text-goi-navy">
                                {
                                  payment.method
                                    .account
                                    .merchantCode
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        {payment.method.account
                          .accountNumber && (
                          <div className="mt-5 border-t border-blue-100 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                              Numéro / compte marchand
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <p className="break-all text-xl font-black text-goi-navy">
                                {
                                  payment.method
                                    .account
                                    .accountNumber
                                }
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  void copyValue(
                                    payment.method
                                      .account!
                                      .accountNumber!,
                                    'accountNumber',
                                  )
                                }
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-goi-navy shadow-sm"
                              >
                                {copiedField ===
                                'accountNumber' ? (
                                  <>
                                    <Check
                                      size={15}
                                    />
                                    Copié
                                  </>
                                ) : (
                                  <>
                                    <Copy
                                      size={15}
                                    />
                                    Copier
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="mt-5 border-t border-blue-100 pt-4 text-sm leading-6 text-goi-muted">
                          Vérifiez le bénéficiaire et le
                          montant avant d’effectuer la
                          transaction.
                        </p>
                      </div>
                    )}

                    {payment.method.type ===
                      'MOBILE_MONEY' &&
                      payment.status ===
                        'PENDING' &&
                      payment.method.account && (
                        <PaymentSubmissionForm
                          reference={
                            order.reference
                          }
                          onSubmitted={(status) => {
                            setOrder(
                              (current) => {
                                if (
                                  !current?.payment
                                ) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  payment: {
                                    ...current.payment,
                                    status,
                                  },
                                };
                              },
                            );
                          }}
                        />
                      )}

                    {payment.method.type ===
                      'MOBILE_MONEY' &&
                      (payment.status ===
                        'SUBMITTED' ||
                        payment.status ===
                          'VERIFYING') && (
                        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                          <p className="font-bold text-goi-navy">
                            Paiement en cours de
                            vérification
                          </p>

                          <p className="mt-2 text-sm leading-6 text-goi-muted">
                            Votre déclaration a été
                            transmise à GOI. Conservez
                            votre preuve de transaction
                            jusqu’à la validation.
                          </p>
                        </div>
                      )}

                    {payment.status === 'PAID' && (
                      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="font-bold text-goi-emerald">
                          Paiement validé
                        </p>

                        <p className="mt-2 text-sm leading-6 text-goi-muted">
                          Le paiement a été vérifié et
                          confirmé par GOI.
                        </p>
                      </div>
                    )}

                    {payment.status ===
                      'REJECTED' && (
                      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                        <p className="font-bold text-goi-danger">
                          Paiement non validé
                        </p>

                        <p className="mt-2 text-sm leading-6 text-goi-muted">
                          Contactez GOI ou vérifiez les
                          informations de transaction.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-semibold text-amber-800">
                      Aucun moyen de paiement associé
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-goi-surface text-goi-navy">
                  <LockKeyhole size={19} />
                </div>

                <div>
                  <p className="font-bold text-goi-navy">
                    Sécurité du paiement
                  </p>

                  <p className="mt-1 text-sm leading-6 text-goi-muted">
                    Ne communiquez jamais votre code PIN,
                    mot de passe ou code secret Mobile Money
                    sur ce site.
                  </p>
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-goi-surface text-goi-navy">
                  <ReceiptText size={19} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                    Récapitulatif
                  </p>

                  <h2 className="font-bold text-goi-navy">
                    Votre commande
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.sku}`}
                    className="flex gap-3 border-b border-slate-100 pb-4 last:border-0"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-goi-surface text-slate-400">
                      <Package size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-goi-navy">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-goi-muted">
                        {item.quantity} ×{' '}
                        {formatPrice(
                          item.unitPrice,
                        )}{' '}
                        FCFA
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-goi-navy">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex justify-between gap-4">
                  <span className="text-goi-muted">
                    Sous-total
                  </span>

                  <span className="font-semibold text-goi-navy">
                    {formatPrice(order.subtotal)} FCFA
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4">
                  <span className="text-goi-muted">
                    Livraison
                  </span>

                  <span className="font-medium text-goi-navy">
                    {order.deliveryMode ===
                    'DELIVERY'
                      ? 'Livraison'
                      : 'Retrait'}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex justify-between border-t border-slate-200 pt-5">
                <span className="font-bold text-goi-navy">
                  Total
                </span>

                <strong className="text-xl font-black text-goi-navy">
                  {formatPrice(
                    payment?.amount ??
                      order.subtotal,
                  )}{' '}
                  FCFA
                </strong>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-goi-surface p-4">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-goi-emerald"
                />

                <p className="text-xs leading-5 text-goi-muted">
                  Vous pouvez quitter cette page. La
                  commande est déjà enregistrée sous la
                  référence {order.reference}.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
