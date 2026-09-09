import {
  Banknote,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

const CHECKOUT_DRAFT_KEY = 'goi_checkout_draft';

const paymentMethods = [
  {
    id: 'orange',
    code: 'ORANGE_MONEY',
    name: 'Orange Money',
    type: 'mobile',
  },
  {
    id: 'moov',
    code: 'MOOV_MONEY',
    name: 'Moov Money',
    type: 'mobile',
  },
  {
    id: 'wave',
    code: 'WAVE',
    name: 'Wave',
    type: 'mobile',
  },
  {
    id: 'coris',
    code: 'CORIS_MONEY',
    name: 'Coris Money',
    type: 'mobile',
  },
  {
    id: 'delivery',
    code: 'CASH_DELIVERY',
    name: 'Paiement à la livraison',
    type: 'cash',
  },
  {
    id: 'pickup',
    code: 'CASH_PICKUP',
    name: 'Paiement au retrait',
    type: 'cash',
  },
  {
    id: 'bank',
    code: 'BANK_TRANSFER',
    name: 'Virement bancaire',
    type: 'bank',
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

type CheckoutDraft = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMode: string;
  deliveryAddress: string;
  paymentMethod: string;
  notes: string;
};

const defaultCheckoutDraft: CheckoutDraft = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deliveryMode: 'delivery',
  deliveryAddress: '',
  paymentMethod: 'orange',
  notes: '',
};

function loadCheckoutDraft(): CheckoutDraft {
  try {
    const saved = sessionStorage.getItem(
      CHECKOUT_DRAFT_KEY,
    );

    if (!saved) {
      return defaultCheckoutDraft;
    }

    const parsed = JSON.parse(
      saved,
    ) as Partial<CheckoutDraft>;

    return {
      customerName:
        typeof parsed.customerName === 'string'
          ? parsed.customerName
          : '',
      customerPhone:
        typeof parsed.customerPhone === 'string'
          ? parsed.customerPhone
          : '',
      customerEmail:
        typeof parsed.customerEmail === 'string'
          ? parsed.customerEmail
          : '',
      deliveryMode:
        parsed.deliveryMode === 'pickup'
          ? 'pickup'
          : 'delivery',
      deliveryAddress:
        typeof parsed.deliveryAddress === 'string'
          ? parsed.deliveryAddress
          : '',
      paymentMethod:
        typeof parsed.paymentMethod === 'string' &&
        paymentMethods.some(
          (method) =>
            method.id === parsed.paymentMethod,
        )
          ? parsed.paymentMethod
          : 'orange',
      notes:
        typeof parsed.notes === 'string'
          ? parsed.notes
          : '',
    };
  } catch {
    return defaultCheckoutDraft;
  }
}

type CreateOrderResponse = {
  data?: {
    reference?: string;
  };
  message?: string;
  error?:
    | string
    | {
        message?: string;
      };
};

function getApiErrorMessage(
  payload: CreateOrderResponse | null,
) {
  if (!payload) {
    return 'Impossible de créer la commande. Veuillez réessayer.';
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  if (
    payload.error &&
    typeof payload.error === 'object' &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return 'Certaines informations sont invalides. Vérifiez les champs puis réessayez.';
}

function PaymentIcon({
  type,
}: {
  type: string;
}) {
  if (type === 'mobile') {
    return <Smartphone size={20} />;
  }

  if (type === 'bank') {
    return <Building2 size={20} />;
  }

  return <Banknote size={20} />;
}

export function CheckoutPage() {
  const navigate = useNavigate();

  const {
    items,
    totalPrice,
    clearCart,
  } = useCart();

  const [draft, setDraft] = useState<CheckoutDraft>(
    loadCheckoutDraft,
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const {
    customerName,
    customerPhone,
    customerEmail,
    deliveryMode,
    deliveryAddress,
    paymentMethod,
    notes,
  } = draft;

  const selectedPaymentMethod =
    paymentMethods.find(
      (method) => method.id === paymentMethod,
    ) ?? paymentMethods[0];

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify(draft),
      );
    } catch {
      // Le formulaire reste utilisable.
    }
  }, [draft]);

  function updateDraft(
    field: keyof CheckoutDraft,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;

    if (!form.reportValidity()) {
      return;
    }

    const normalizedCustomerName =
      customerName.trim();

    const normalizedCustomerPhone =
      customerPhone.trim();

    const normalizedCustomerEmail =
      customerEmail.trim();

    const normalizedDeliveryAddress =
      deliveryAddress.trim();

    const normalizedNotes = notes.trim();

    if (!normalizedCustomerName) {
      setSubmitError(
        'Veuillez renseigner votre nom complet.',
      );
      return;
    }

    if (!normalizedCustomerPhone) {
      setSubmitError(
        'Veuillez renseigner votre numéro de téléphone.',
      );
      return;
    }

    if (
      deliveryMode === 'delivery' &&
      !normalizedDeliveryAddress
    ) {
      setSubmitError(
        'Veuillez renseigner votre adresse de livraison.',
      );
      return;
    }

    if (!selectedPaymentMethod) {
      setSubmitError(
        'Veuillez sélectionner un moyen de paiement.',
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName:
              normalizedCustomerName,
            customerPhone:
              normalizedCustomerPhone,
            ...(normalizedCustomerEmail
              ? {
                  customerEmail:
                    normalizedCustomerEmail,
                }
              : {}),
            deliveryMode:
              deliveryMode === 'delivery'
                ? 'DELIVERY'
                : 'PICKUP',
            paymentMethodCode:
              selectedPaymentMethod.code,
            ...(deliveryMode === 'delivery'
              ? {
                  deliveryAddress:
                    normalizedDeliveryAddress,
                }
              : {}),
            ...(normalizedNotes
              ? { notes: normalizedNotes }
              : {}),
            items: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
        },
      );

      const payload = (await response
        .json()
        .catch(
          () => null,
        )) as CreateOrderResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload),
        );
      }

      const reference = payload?.data?.reference;

      if (!reference) {
        throw new Error(
          'La commande a été créée mais aucune référence n’a été reçue.',
        );
      }

      sessionStorage.removeItem(
        CHECKOUT_DRAFT_KEY,
      );

      clearCart();

      navigate(
        `/commande/${encodeURIComponent(reference)}/paiement`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          'Une erreur inattendue est survenue. Veuillez réessayer.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="bg-goi-surface py-16">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <PackageCheck
                size={32}
                className="mx-auto text-goi-muted"
              />

              <h1 className="mt-5 text-3xl font-extrabold text-goi-navy">
                Votre panier est vide
              </h1>

              <Link
                to="/produits"
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-goi-blue px-6 font-semibold text-white"
              >
                Voir les produits
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </>
    );
  }

  if (!selectedPaymentMethod) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="bg-goi-surface py-16">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <h1 className="text-2xl font-extrabold text-goi-navy">
                Aucun moyen de paiement disponible
              </h1>

              <p className="mt-3 text-sm text-goi-muted">
                Aucun moyen de paiement actif ne peut être utilisé pour le moment.
              </p>

              <Link
                to="/panier"
                className="mt-6 inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-6 font-semibold text-goi-navy"
              >
                Retour au panier
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </>
    );
  }

  let submitLabel = `Continuer avec ${selectedPaymentMethod.name}`;

  if (
    selectedPaymentMethod.code ===
      'CASH_DELIVERY' ||
    selectedPaymentMethod.code === 'CASH_PICKUP'
  ) {
    submitLabel = 'Confirmer la commande';
  }

  if (
    selectedPaymentMethod.code ===
    'BANK_TRANSFER'
  ) {
    submitLabel =
      'Créer la commande et voir les instructions';
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-goi-surface py-8 sm:py-10">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-goi-muted">
              <span className="text-goi-emerald">
                Panier
              </span>
              <ChevronRight size={14} />
              <span className="text-goi-blue">
                Informations
              </span>
              <ChevronRight size={14} />
              <span>Paiement</span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-goi-navy sm:text-4xl">
              Finaliser votre commande
            </h1>

            <p className="mt-2 max-w-2xl text-goi-muted">
              Vérifiez vos coordonnées, choisissez la
              livraison puis le moyen de paiement.
            </p>
          </div>

          <form
            className="grid gap-7 lg:grid-cols-[1fr_370px]"
            onSubmit={handleSubmit}
          >
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-goi-blue/10 text-goi-blue">
                    <CreditCard size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                      Étape 1
                    </p>
                    <h2 className="font-bold text-goi-navy">
                      Vos coordonnées
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-goi-navy">
                      Nom complet *
                    </span>

                    <input
                      required
                      type="text"
                      name="customerName"
                      autoComplete="name"
                      value={customerName}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'customerName',
                          event.target.value,
                        )
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/10 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-goi-navy">
                      Téléphone *
                    </span>

                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      name="customerPhone"
                      autoComplete="tel"
                      placeholder="+226"
                      value={customerPhone}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'customerPhone',
                          event.target.value,
                        )
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/10 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold text-goi-navy">
                      Email
                    </span>

                    <input
                      type="email"
                      name="customerEmail"
                      autoComplete="email"
                      value={customerEmail}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'customerEmail',
                          event.target.value,
                        )
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/10 disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-goi-blue/10 text-goi-blue">
                    <Truck size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                      Étape 2
                    </p>
                    <h2 className="font-bold text-goi-navy">
                      Livraison ou retrait
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      deliveryMode === 'delivery'
                        ? 'border-goi-blue bg-goi-blue/5 ring-1 ring-goi-blue'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={
                        deliveryMode === 'delivery'
                      }
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'deliveryMode',
                          event.target.value,
                        )
                      }
                      className="sr-only"
                    />

                    <div className="flex items-start gap-3">
                      <Truck
                        size={21}
                        className="mt-0.5 text-goi-blue"
                      />

                      <div>
                        <p className="font-semibold text-goi-navy">
                          Livraison
                        </p>

                        <p className="mt-1 text-xs leading-5 text-goi-muted">
                          Livraison à l’adresse indiquée.
                        </p>
                      </div>

                      {deliveryMode ===
                        'delivery' && (
                        <Check
                          size={18}
                          className="ml-auto text-goi-blue"
                        />
                      )}
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      deliveryMode === 'pickup'
                        ? 'border-goi-blue bg-goi-blue/5 ring-1 ring-goi-blue'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={
                        deliveryMode === 'pickup'
                      }
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'deliveryMode',
                          event.target.value,
                        )
                      }
                      className="sr-only"
                    />

                    <div className="flex items-start gap-3">
                      <Store
                        size={21}
                        className="mt-0.5 text-goi-blue"
                      />

                      <div>
                        <p className="font-semibold text-goi-navy">
                          Retrait
                        </p>

                        <p className="mt-1 text-xs leading-5 text-goi-muted">
                          Retrait après confirmation GOI.
                        </p>
                      </div>

                      {deliveryMode === 'pickup' && (
                        <Check
                          size={18}
                          className="ml-auto text-goi-blue"
                        />
                      )}
                    </div>
                  </label>
                </div>

                {deliveryMode === 'delivery' && (
                  <label className="mt-5 block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-goi-navy">
                      <MapPin size={16} />
                      Zone / adresse de livraison *
                    </span>

                    <textarea
                      required
                      rows={3}
                      name="deliveryAddress"
                      autoComplete="street-address"
                      value={deliveryAddress}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'deliveryAddress',
                          event.target.value,
                        )
                      }
                      placeholder="Quartier, secteur, repère utile..."
                      className="mt-2 w-full rounded-xl border border-slate-200 p-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/10 disabled:bg-slate-100"
                    />
                  </label>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-goi-blue/10 text-goi-blue">
                    <Smartphone size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                      Étape 3
                    </p>
                    <h2 className="font-bold text-goi-navy">
                      Moyen de paiement
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const selected =
                      paymentMethod === method.id;

                    return (
                      <label
                        key={method.id}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          selected
                            ? 'border-goi-blue bg-goi-blue/5 ring-1 ring-goi-blue'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selected}
                          disabled={isSubmitting}
                          onChange={(event) =>
                            updateDraft(
                              'paymentMethod',
                              event.target.value,
                            )
                          }
                          className="sr-only"
                        />

                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-goi-surface text-goi-navy">
                            <PaymentIcon
                              type={method.type}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-goi-navy">
                              {method.name}
                            </p>

                            <p className="mt-1 text-xs text-goi-muted">
                              {method.type === 'mobile'
                                ? 'Validation manuelle'
                                : method.type === 'bank'
                                  ? 'Instructions après création'
                                  : 'Paiement hors ligne'}
                            </p>
                          </div>

                          {selected && (
                            <Check
                              size={18}
                              className="ml-auto text-goi-blue"
                            />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <label>
                  <span className="text-sm font-semibold text-goi-navy">
                    Commentaire
                  </span>

                  <textarea
                    rows={3}
                    name="notes"
                    value={notes}
                    placeholder="Précisions utiles pour GOI..."
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateDraft(
                        'notes',
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 p-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/10 disabled:bg-slate-100"
                  />
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                Votre commande
              </p>

              <div className="mt-5 max-h-[300px] space-y-3 overflow-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0"
                  >
                    <span className="min-w-0 text-goi-muted">
                      <span className="line-clamp-2">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-xs">
                        × {item.quantity}
                      </span>
                    </span>

                    <span className="shrink-0 font-semibold text-goi-navy">
                      {formatPrice(
                        item.price *
                          item.quantity,
                      )}{' '}
                      FCFA
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-semibold text-goi-navy">
                    Total produits
                  </span>

                  <strong className="text-2xl font-black text-goi-navy">
                    {formatPrice(totalPrice)}
                    <span className="ml-1 text-base">
                      FCFA
                    </span>
                  </strong>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-goi-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                  Paiement sélectionné
                </p>

                <p className="mt-1 font-semibold text-goi-navy">
                  {selectedPaymentMethod.name}
                </p>
              </div>

              {submitError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-goi-danger"
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 min-h-12 w-full rounded-xl bg-goi-blue px-5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Création de la commande...'
                  : submitLabel}
              </button>

              <div className="mt-5 flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-goi-emerald"
                />

                <p className="text-xs leading-5 text-goi-muted">
                  La commande est enregistrée avant le
                  paiement. Aucun code PIN ou mot de passe
                  Mobile Money ne vous sera demandé.
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
