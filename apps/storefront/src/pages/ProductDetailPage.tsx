import {
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';
import {
  getAvailabilityLabel,
  getProduct,
  isPurchasable,
  type CatalogProduct,
} from '../lib/catalog';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

export function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] =
    useState<CatalogProduct | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoadError('Le produit demandé est invalide.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setLoadError(null);

    getProduct(slug, controller.signal)
      .then((data) => {
        setProduct(data);
        setQuantity(data.minOrderQty);
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Impossible de récupérer ce produit.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug]);

  if (isLoading) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6">
          <div className="h-[520px] animate-pulse rounded-goi-lg bg-goi-surface" />
        </main>

        <SiteFooter />
      </>
    );
  }

  if (loadError || !product) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6">
          <h1 className="text-3xl font-extrabold text-goi-navy">
            Produit introuvable
          </h1>

          <p className="mt-3 text-goi-muted">
            {loadError ??
              'Ce produit n’existe pas ou n’est plus disponible.'}
          </p>

          <Link
            to="/produits"
            className="mt-6 inline-flex rounded-goi-md bg-goi-blue px-5 py-3 font-semibold text-white"
          >
            Retour au catalogue
          </Link>
        </main>

        <SiteFooter />
      </>
    );
  }

  const canAdd = isPurchasable(product);

  function handleAddToCart() {
    if (!product || product.price === null || !canAdd) {
      return;
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        unit: product.unit,
      },
      quantity,
    );
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6 lg:py-14">
          <nav className="mb-8 text-sm text-goi-muted">
            <Link
              to="/"
              className="hover:text-goi-blue"
            >
              Accueil
            </Link>

            <span className="mx-2">/</span>

            <Link
              to="/produits"
              className="hover:text-goi-blue"
            >
              Produits
            </Link>

            <span className="mx-2">/</span>

            <Link
              to={`/produits?categorie=${encodeURIComponent(
                product.category.slug,
              )}`}
              className="hover:text-goi-blue"
            >
              {product.category.name}
            </Link>

            <span className="mx-2">/</span>

            <span className="text-goi-slate">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-goi-lg bg-gradient-to-br from-slate-100 to-slate-200">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-semibold text-slate-400">
                  Visuel produit
                </span>
              )}

              {product.featured && (
                <span className="absolute left-5 top-5 rounded-full bg-goi-gold px-4 py-2 text-sm font-bold text-goi-navy">
                  Vedette
                </span>
              )}
            </div>

            <div className="lg:py-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-goi-muted">
                {product.sku}
              </p>

              <p className="mt-2 text-sm font-semibold text-goi-blue">
                {product.category.name}
              </p>

              <h1 className="mt-3 text-3xl font-extrabold text-goi-navy sm:text-4xl">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="mt-4 leading-7 text-goi-muted">
                  {product.shortDescription}
                </p>
              )}

              <p
                className={`mt-5 text-sm font-semibold ${
                  product.availability === 'OUT_OF_STOCK'
                    ? 'text-goi-danger'
                    : 'text-goi-emerald'
                }`}
              >
                {getAvailabilityLabel(
                  product.availability,
                )}
              </p>

              <div className="mt-6">
                {product.price !== null ? (
                  <>
                    <p className="text-3xl font-extrabold text-goi-navy">
                      {formatPrice(product.price)} FCFA
                    </p>

                    <p className="mt-1 text-sm text-goi-muted">
                      Prix / {product.unit}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-extrabold text-goi-navy">
                    Prix sur devis
                  </p>
                )}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-goi-md bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                    Minimum de commande
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    {product.minOrderQty} {product.unit}
                  </p>
                </div>

                <div className="rounded-goi-md bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                    Conditionnement
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    Pack de {product.packSize}
                  </p>
                </div>
              </div>

              {canAdd && (
                <div className="mt-8 border-y border-slate-200 py-6">
                  <p className="font-semibold text-goi-navy">
                    Quantité
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-goi-md border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) =>
                            Math.max(
                              product.minOrderQty,
                              value - 1,
                            ),
                          )
                        }
                        className="flex size-11 items-center justify-center hover:bg-goi-surface"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus size={18} />
                      </button>

                      <span className="w-12 text-center font-bold">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            (value) => value + 1,
                          )
                        }
                        className="flex size-11 items-center justify-center hover:bg-goi-surface"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <span className="text-sm text-goi-muted">
                      {product.unit}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={handleAddToCart}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShoppingCart size={19} />

                  {canAdd
                    ? 'Ajouter au panier'
                    : 'Indisponible pour le moment'}
                </button>

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-goi-md border border-slate-300 px-6 font-semibold text-goi-navy hover:bg-goi-surface"
                >
                  Demander un devis
                </Link>
              </div>

              <div className="mt-8 rounded-goi-lg bg-goi-surface p-6">
                <h2 className="font-bold text-goi-navy">
                  À propos de ce produit
                </h2>

                <p className="mt-3 text-sm leading-6 text-goi-muted">
                  {product.description ??
                    product.shortDescription ??
                    'Les informations détaillées de ce produit seront prochainement disponibles.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
