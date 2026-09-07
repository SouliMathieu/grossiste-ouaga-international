import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

export function CartPage() {
  const {
    items,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-goi-surface py-10 sm:py-12">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
              Votre sélection
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-goi-navy sm:text-4xl">
              Panier
            </h1>

            <p className="mt-2 text-goi-muted">
              Vérifiez les produits et quantités avant de
              finaliser votre commande.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-goi-surface text-goi-muted">
                <Package size={25} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-goi-navy">
                Votre panier est vide
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-goi-muted">
                Parcourez le catalogue et ajoutez les produits
                dont vous avez besoin.
              </p>

              <Link
                to="/produits"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-blue px-6 font-semibold text-white"
              >
                Voir le catalogue
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px]">
              <section className="space-y-3">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-goi-navy">
                    {items.length} référence
                    {items.length > 1 ? 's' : ''}
                  </p>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm font-semibold text-goi-danger hover:underline"
                  >
                    Vider le panier
                  </button>
                </div>

                {items.map((item) => {
                  const lineTotal =
                    item.price * item.quantity;

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                        <div className="flex aspect-square items-center justify-center rounded-xl bg-goi-surface text-slate-400">
                          <Package size={27} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                            {item.sku}
                          </p>

                          <h2 className="mt-1 text-lg font-bold text-goi-navy">
                            {item.name}
                          </h2>

                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-goi-navy">
                              {formatPrice(item.price)} FCFA
                            </span>

                            <span className="text-xs text-goi-muted">
                              / {item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <p className="text-lg font-extrabold text-goi-navy">
                            {formatPrice(lineTotal)} FCFA
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="flex size-9 items-center justify-center rounded-lg text-goi-danger transition hover:bg-red-50"
                            aria-label={`Supprimer ${item.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-sm text-goi-muted">
                          Quantité
                        </span>

                        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(
                                  1,
                                  item.quantity - 1,
                                ),
                              )
                            }
                            className="flex size-10 items-center justify-center transition hover:bg-goi-surface"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="w-11 text-center font-bold text-goi-navy">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                              )
                            }
                            className="flex size-10 items-center justify-center transition hover:bg-goi-surface"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                <Link
                  to="/produits"
                  className="inline-flex items-center gap-2 pt-3 text-sm font-semibold text-goi-blue"
                >
                  <ArrowLeft size={16} />
                  Continuer mes achats
                </Link>
              </section>

              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
                <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                  Récapitulatif
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-goi-navy">
                  Votre commande
                </h2>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-goi-muted">
                      Articles
                    </span>

                    <span className="font-semibold text-goi-navy">
                      {items.reduce(
                        (sum, item) =>
                          sum + item.quantity,
                        0,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-goi-muted">
                      Sous-total
                    </span>

                    <span className="font-semibold text-goi-navy">
                      {formatPrice(totalPrice)} FCFA
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-goi-muted">
                      Livraison
                    </span>

                    <span className="text-right font-medium text-goi-muted">
                      À confirmer
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5">
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

                <Link
                  to="/commande"
                  className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-goi-blue px-5 font-semibold text-white transition hover:bg-blue-700"
                >
                  Finaliser la commande
                  <ArrowRight size={18} />
                </Link>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-goi-surface p-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-goi-emerald"
                  />

                  <p className="text-xs leading-5 text-goi-muted">
                    Votre commande sera enregistrée avant
                    toute opération de paiement.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
