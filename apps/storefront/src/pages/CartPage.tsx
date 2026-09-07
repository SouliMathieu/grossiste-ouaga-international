import { Minus, Plus, Trash2 } from 'lucide-react';
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

      <main className="bg-goi-surface py-10 sm:py-14">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold text-goi-navy">
            Votre panier
          </h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-goi-lg bg-white p-8 text-center">
              <h2 className="text-xl font-bold text-goi-navy">
                Votre panier est vide
              </h2>

              <Link
                to="/produits"
                className="mt-5 inline-flex rounded-goi-md bg-goi-blue px-5 py-3 font-semibold text-white"
              >
                Voir les produits
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-5 rounded-goi-lg bg-white p-5 sm:grid-cols-[120px_1fr_auto]"
                  >
                    <div className="flex aspect-square items-center justify-center rounded-goi-md bg-slate-100 text-sm text-slate-400">
                      Visuel
                    </div>

                    <div>
                      <p className="text-xs text-goi-muted">
                        {item.sku}
                      </p>

                      <h2 className="mt-1 font-bold text-goi-navy">
                        {item.name}
                      </h2>

                      <p className="mt-2 font-semibold text-goi-navy">
                        {formatPrice(item.price)} FCFA
                      </p>

                      <p className="text-xs text-goi-muted">
                        / {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-between">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-goi-danger"
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 size={19} />
                      </button>

                      <div className="flex items-center rounded-goi-md border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="flex size-10 items-center justify-center"
                        >
                          <Minus size={16} />
                        </button>

                        <span className="w-10 text-center font-bold">
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
                          className="flex size-10 items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="h-fit rounded-goi-lg bg-white p-6">
                <h2 className="text-xl font-bold text-goi-navy">
                  Résumé
                </h2>

                <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-4">
                  <span className="text-goi-muted">Sous-total</span>

                  <strong className="text-xl text-goi-navy">
                    {formatPrice(totalPrice)} FCFA
                  </strong>
                </div>

                <p className="mt-4 text-sm leading-6 text-goi-muted">
                  Les frais de livraison seront confirmés selon votre zone.
                </p>

                <Link
                  to="/commande"
                  className="mt-6 flex min-h-12 items-center justify-center rounded-goi-md bg-goi-blue px-5 font-semibold text-white hover:bg-blue-700"
                >
                  Passer la commande
                </Link>

                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-3 w-full py-3 text-sm font-semibold text-goi-danger"
                >
                  Vider le panier
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
