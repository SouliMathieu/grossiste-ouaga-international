import { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { SiteFooter } from '../components/layout/SiteFooter';

import { SiteHeader } from '../components/layout/SiteHeader';

import { TopBar } from '../components/layout/TopBar';
import { PaymentSubmissionForm } from '../components/payment/PaymentSubmissionForm';



const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';



const formatPrice = (price: number) =>

  new Intl.NumberFormat('fr-FR').format(price);



type OrderItem = {

  productId: number;

  name: string;

  sku: string;

  unit: string;

  unitPrice: number;

  quantity: number;

  lineTotal: number;

};



type PaymentAccount = {

  accountName: string | null;

  accountNumber: string | null;

  merchantCode: string | null;

  actionUrl: string | null;

  ussdTemplate: string | null;

};



type Payment = {

  id: number;

  status: string;

  amount: number;

  currency: string;

  method: {

    code: string;

    name: string;

    type: string;

    instructions: string | null;

    account: PaymentAccount | null;

  };

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



type CopiedField = 'reference' | 'amount' | 'accountNumber' | null;



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

      return 'bg-goi-emerald/10 text-goi-emerald';

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



export function PaymentPage() {

  const { reference } = useParams();



  const [order, setOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const [copyError, setCopyError] = useState<string | null>(null);



  useEffect(() => {

    if (!reference) {

      setLoadError('La référence de commande est invalide.');

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

          .catch(() => null)) as OrderResponse | null;



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

        if (error instanceof DOMException && error.name === 'AbortError') {

          return;

        }



        if (error instanceof Error) {

          setLoadError(error.message);

        } else {

          setLoadError('Une erreur inattendue est survenue.');

        }

      } finally {

        if (!controller.signal.aborted) {

          setIsLoading(false);

        }

      }

    }



    void loadOrder();



    return () => {

      controller.abort();

    };

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

        'La copie automatique a échoué. Vous pouvez sélectionner la valeur manuellement.',

      );

    }

  }



  return (

    <>

      <TopBar />

      <SiteHeader />



      <main className="bg-goi-surface py-10 sm:py-14">

        <div className="mx-auto max-w-[900px] px-4 sm:px-6">

          {isLoading && (

            <div className="rounded-goi-lg bg-white p-6 sm:p-8">

              <p className="font-semibold text-goi-navy">

                Chargement de votre commande...

              </p>



              <p className="mt-2 text-sm text-goi-muted">

                Nous récupérons les informations enregistrées.

              </p>

            </div>

          )}



          {!isLoading && loadError && (

            <div className="rounded-goi-lg bg-white p-6 sm:p-8">

              <h1 className="text-3xl font-extrabold text-goi-navy">

                Impossible d’afficher la commande

              </h1>



              <div

                role="alert"

                className="mt-5 rounded-goi-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-goi-danger"

              >

                {loadError}

              </div>



              <Link

                to="/produits"

                className="mt-6 inline-flex min-h-12 items-center rounded-goi-md bg-goi-blue px-5 font-semibold text-white"

              >

                Retour aux produits

              </Link>

            </div>

          )}



          {!isLoading && order && (

            <div className="rounded-goi-lg bg-white p-6 sm:p-8">

              <div className="inline-flex rounded-full bg-goi-emerald/10 px-3 py-1 text-sm font-semibold text-goi-emerald">

                Commande enregistrée

              </div>



              <h1 className="mt-5 text-3xl font-extrabold text-goi-navy">

                Effectuer votre paiement

              </h1>



              <p className="mt-3 leading-7 text-goi-muted">

                Votre commande est enregistrée. Conservez sa référence pour

                toute demande concernant votre achat.

              </p>



              <div className="mt-8 grid gap-4 sm:grid-cols-2">

                <div className="rounded-goi-md border border-slate-200 p-5">

                  <p className="text-sm font-semibold text-goi-muted">

                    Référence de commande

                  </p>



                  <p className="mt-2 break-all text-xl font-extrabold text-goi-navy">

                    {order.reference}

                  </p>



                  <button

                    type="button"

                    onClick={() =>

                      void copyValue(order.reference, 'reference')

                    }

                    className="mt-4 min-h-11 rounded-goi-md border border-slate-200 px-4 text-sm font-semibold text-goi-navy hover:bg-goi-surface focus:outline-none focus:ring-2 focus:ring-goi-blue focus:ring-offset-2"

                  >

                    {copiedField === 'reference'

                      ? 'Copié'

                      : 'Copier la référence'}

                  </button>

                </div>



                <div className="rounded-goi-md border border-slate-200 p-5">

                  <p className="text-sm font-semibold text-goi-muted">

                    Montant à payer

                  </p>



                  <p className="mt-2 text-xl font-extrabold text-goi-navy">

                    {formatPrice(order.payment?.amount ?? order.subtotal)} FCFA

                  </p>



                  <button

                    type="button"

                    onClick={() =>

                      void copyValue(

                        String(order.payment?.amount ?? order.subtotal),

                        'amount',

                      )

                    }

                    className="mt-4 min-h-11 rounded-goi-md border border-slate-200 px-4 text-sm font-semibold text-goi-navy hover:bg-goi-surface focus:outline-none focus:ring-2 focus:ring-goi-blue focus:ring-offset-2"

                  >

                    {copiedField === 'amount'

                      ? 'Copié'

                      : 'Copier le montant'}

                  </button>

                </div>

              </div>



              {copyError && (

                <div

                  role="alert"

                  className="mt-4 rounded-goi-md border border-red-200 bg-red-50 p-4 text-sm text-goi-danger"

                >

                  {copyError}

                </div>

              )}



              {order.payment ? (

                <section className="mt-6 rounded-goi-lg border border-slate-200 p-5 sm:p-6">

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-goi-muted">

                        Moyen de paiement

                      </p>



                      <h2 className="mt-1 text-xl font-bold text-goi-navy">

                        {order.payment.method.name}

                      </h2>

                    </div>



                    <span

                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getPaymentStatusClasses(

                        order.payment.status,

                      )}`}

                    >

                      {getPaymentStatusLabel(order.payment.status)}

                    </span>

                  </div>



                  <div className="mt-6 border-t border-slate-200 pt-5">

                    <h3 className="font-bold text-goi-navy">

                      Instructions de paiement

                    </h3>



                    <p className="mt-2 leading-7 text-goi-muted">

                      {order.payment.method.instructions ??

                        'Suivez les instructions communiquées par GOI pour effectuer votre paiement.'}

                    </p>

                  </div>



                  {order.payment.method.type === 'MOBILE_MONEY' && (

                    <div className="mt-5 rounded-goi-md bg-goi-surface p-5">

                      <p className="font-semibold text-goi-navy">

                        Paiement Mobile Money

                      </p>



                      {order.payment.method.account ? (

                        <div className="mt-4 space-y-4">

                          {order.payment.method.account.accountName && (

                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">

                                Bénéficiaire

                              </p>



                              <p className="mt-1 font-semibold text-goi-navy">

                                {order.payment.method.account.accountName}

                              </p>

                            </div>

                          )}



                          {order.payment.method.account.accountNumber && (

                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">

                                Numéro / compte marchand

                              </p>



                              <p className="mt-1 break-all text-lg font-bold text-goi-navy">

                                {order.payment.method.account.accountNumber}

                              </p>



                              <button

                                type="button"

                                onClick={() =>

                                  void copyValue(

                                    order.payment!.method.account!.accountNumber!,

                                    'accountNumber',

                                  )

                                }

                                className="mt-3 min-h-11 rounded-goi-md border border-slate-200 bg-white px-4 text-sm font-semibold text-goi-navy hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-goi-blue focus:ring-offset-2"

                              >

                                {copiedField === 'accountNumber'

                                  ? 'Copié'

                                  : 'Copier le numéro'}

                              </button>

                            </div>

                          )}



                          {order.payment.method.account.merchantCode && (

                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">

                                Code marchand

                              </p>



                              <p className="mt-1 font-bold text-goi-navy">

                                {order.payment.method.account.merchantCode}

                              </p>

                            </div>

                          )}



                          <p className="border-t border-slate-200 pt-4 text-sm leading-6 text-goi-muted">

                            Vérifiez le montant et le bénéficiaire avant de

                            confirmer votre paiement.

                          </p>

                        </div>

                      ) : (

                        <p className="mt-2 text-sm leading-6 text-goi-muted">

                          Le numéro marchand GOI sera affiché ici lorsqu’il aura

                          été configuré et validé côté serveur.

                        </p>

                      )}



                      <p className="mt-4 text-sm leading-6 text-goi-muted">

                        Vous pouvez quitter temporairement cette page pour

                        effectuer le paiement. Votre commande est déjà

                        enregistrée.

                      </p>

                    </div>

                  )}

                  {order.payment.method.type === 'MOBILE_MONEY' &&
                    order.payment.status === 'PENDING' &&
                    order.payment.method.account && (
                      <PaymentSubmissionForm
                        reference={order.reference}
                        onSubmitted={(status) => {
                          setOrder((current) => {
                            if (!current?.payment) {
                              return current;
                            }

                            return {
                              ...current,
                              payment: {
                                ...current.payment,
                                status,
                              },
                            };
                          });
                        }}
                      />
                    )}

                  {order.payment.method.type === 'MOBILE_MONEY' &&
                    (order.payment.status === 'SUBMITTED' ||
                      order.payment.status === 'VERIFYING') && (
                      <div className="mt-6 rounded-goi-md border border-blue-200 bg-blue-50 p-5">
                        <p className="font-semibold text-goi-navy">
                          Confirmation reçue
                        </p>

                        <p className="mt-2 text-sm leading-6 text-goi-muted">
                          Votre paiement a été transmis pour vérification.
                          Conservez votre preuve de transaction jusqu’à la
                          validation par GOI.
                        </p>
                      </div>
                    )}


                </section>

              ) : (

                <div className="mt-6 rounded-goi-md border border-amber-200 bg-amber-50 p-5">

                  <p className="font-semibold text-amber-800">

                    Moyen de paiement indisponible

                  </p>



                  <p className="mt-2 text-sm leading-6 text-amber-700">

                    Aucun paiement n’est actuellement associé à cette commande.

                  </p>

                </div>

              )}



              <div className="mt-6 rounded-goi-md border border-slate-200 bg-goi-surface p-5">

                <p className="font-semibold text-goi-navy">

                  Sécurité

                </p>



                <p className="mt-2 text-sm leading-6 text-goi-muted">

                  Ne communiquez jamais votre code PIN, mot de passe ou code

                  secret Mobile Money sur ce site.

                </p>

              </div>



              <div className="mt-8">

                <h2 className="text-xl font-bold text-goi-navy">

                  Votre commande

                </h2>



                <div className="mt-4 divide-y divide-slate-200 rounded-goi-md border border-slate-200">

                  {order.items.map((item) => (

                    <div

                      key={`${item.productId}-${item.sku}`}

                      className="flex items-start justify-between gap-4 p-4"

                    >

                      <div>

                        <p className="font-semibold text-goi-navy">

                          {item.name}

                        </p>



                        <p className="mt-1 text-sm text-goi-muted">

                          {item.sku} · {item.quantity} ×{' '}

                          {formatPrice(item.unitPrice)} FCFA

                        </p>

                      </div>



                      <p className="shrink-0 font-bold text-goi-navy">

                        {formatPrice(item.lineTotal)} FCFA

                      </p>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          )}

        </div>

      </main>



      <SiteFooter />

    </>

  );

}

