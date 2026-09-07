import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const CHECKOUT_DRAFT_KEY = 'goi_checkout_draft';

const paymentMethods = [
  { id: 'orange', code: 'ORANGE_MONEY', name: 'Orange Money' },
  { id: 'moov', code: 'MOOV_MONEY', name: 'Moov Money' },
  { id: 'wave', code: 'WAVE', name: 'Wave' },
  { id: 'coris', code: 'CORIS_MONEY', name: 'Coris Money' },
  {
    id: 'delivery',
    code: 'CASH_DELIVERY',
    name: 'Paiement à la livraison',
  },
  {
    id: 'pickup',
    code: 'CASH_PICKUP',
    name: 'Paiement au retrait',
  },
  {
    id: 'bank',
    code: 'BANK_TRANSFER',
    name: 'Virement bancaire',
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
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);

    if (!saved) {
      return defaultCheckoutDraft;
    }

    const parsed = JSON.parse(saved) as Partial<CheckoutDraft>;

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
          (method) => method.id === parsed.paymentMethod,
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

  return 'Impossible de créer la commande. Vérifiez vos informations puis réessayez.';
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();

  const [draft, setDraft] = useState<CheckoutDraft>(
    loadCheckoutDraft,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify(draft),
      );
    } catch {
      // Le checkout reste utilisable même si sessionStorage est indisponible.
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

    const normalizedCustomerName = customerName.trim();
    const normalizedCustomerPhone = customerPhone.trim();
    const normalizedCustomerEmail = customerEmail.trim();
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

    const selectedPaymentMethod = paymentMethods.find(
      (method) => method.id === paymentMethod,
    );

    if (!selectedPaymentMethod) {
      setSubmitError(
        'Veuillez sélectionner un moyen de paiement valide.',
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
            customerName: normalizedCustomerName,
            customerPhone: normalizedCustomerPhone,
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
        .catch(() => null)) as CreateOrderResponse | null;

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

      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);

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

        <main className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6">
          <h1 className="text-3xl font-extrabold text-goi-navy">
            Votre panier est vide
          </h1>

          <Link
            to="/produits"
            className="mt-6 inline-flex rounded-goi-md bg-goi-blue px-5 py-3 font-semibold text-white"
          >
            Voir les produits
          </Link>
        </main>

        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-goi-surface py-10 sm:py-14">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold text-goi-navy">
            Finaliser votre commande
          </h1>

          <p className="mt-2 text-goi-muted">
            Renseignez vos informations puis choisissez votre mode de paiement.
          </p>

          <form
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
            onSubmit={handleSubmit}
          >
            <div className="space-y-6">
              <section className="rounded-goi-lg bg-white p-6">
                <h2 className="text-xl font-bold text-goi-navy">
                  Vos coordonnées
                </h2>

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
                      className="mt-2 h-12 w-full rounded-goi-md border border-slate-200 px-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-goi-navy">
                      Téléphone *
                    </span>

                    <input
                      required
                      type="tel"
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
                      className="mt-2 h-12 w-full rounded-goi-md border border-slate-200 px-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      className="mt-2 h-12 w-full rounded-goi-md border border-slate-200 px-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-goi-lg bg-white p-6">
                <h2 className="text-xl font-bold text-goi-navy">
                  Livraison ou retrait
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className="cursor-pointer rounded-goi-md border border-slate-200 p-4">
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={deliveryMode === 'delivery'}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'deliveryMode',
                          event.target.value,
                        )
                      }
                    />

                    <span className="ml-3 font-semibold">
                      Livraison
                    </span>
                  </label>

                  <label className="cursor-pointer rounded-goi-md border border-slate-200 p-4">
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={deliveryMode === 'pickup'}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        updateDraft(
                          'deliveryMode',
                          event.target.value,
                        )
                      }
                    />

                    <span className="ml-3 font-semibold">
                      Retrait
                    </span>
                  </label>
                </div>

                {deliveryMode === 'delivery' && (
                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-goi-navy">
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
                      className="mt-2 w-full rounded-goi-md border border-slate-200 p-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                )}
              </section>

              <section className="rounded-goi-lg bg-white p-6">
                <h2 className="text-xl font-bold text-goi-navy">
                  Moyen de paiement
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`cursor-pointer rounded-goi-md border p-4 ${
                        paymentMethod === method.id
                          ? 'border-goi-blue bg-goi-blue/5'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={
                          paymentMethod === method.id
                        }
                        disabled={isSubmitting}
                        onChange={(event) =>
                          updateDraft(
                            'paymentMethod',
                            event.target.value,
                          )
                        }
                      />

                      <span className="ml-3 font-semibold text-goi-navy">
                        {method.name}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-goi-lg bg-white p-6">
                <label>
                  <span className="text-sm font-semibold text-goi-navy">
                    Commentaire
                  </span>

                  <textarea
                    rows={4}
                    name="notes"
                    value={notes}
                    placeholder="Informations complémentaires..."
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateDraft(
                        'notes',
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-goi-md border border-slate-200 p-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-goi-lg bg-white p-6">
              <h2 className="text-xl font-bold text-goi-navy">
                Résumé
              </h2>

              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-goi-muted">
                      {item.name} × {item.quantity}
                    </span>

                    <span className="font-semibold text-goi-navy">
                      {formatPrice(
                        item.price * item.quantity,
                      )}{' '}
                      FCFA
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between border-t border-slate-200 pt-5">
                <span className="font-semibold">
                  Total
                </span>

                <strong className="text-xl text-goi-navy">
                  {formatPrice(totalPrice)} FCFA
                </strong>
              </div>

              {submitError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-5 rounded-goi-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-goi-danger"
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 min-h-12 w-full rounded-goi-md bg-goi-blue px-5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Création de la commande...'
                  : 'Continuer vers le paiement'}
              </button>

              <p className="mt-3 text-xs leading-5 text-goi-muted">
                La commande sera enregistrée avant toute opération de paiement.
              </p>
            </aside>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
