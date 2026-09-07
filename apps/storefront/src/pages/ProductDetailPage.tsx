import {
  ArrowLeft,
  Check,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';
import {
  getProduct,
  isPurchasable,
  type CatalogProduct,
} from '../lib/catalog';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

function getAvailabilityMeta(status: string) {
  switch (status) {
    case 'IN_STOCK':
      return {
        label: 'Disponible',
        classes: 'bg-emerald-50 text-goi-emerald',
        text: 'Ce produit peut être commandé actuellement.',
      };

    case 'LOW_STOCK':
      return {
        label: 'Stock limité',
        classes: 'bg-amber-50 text-amber-700',
        text: 'La disponibilité peut évoluer rapidement.',
      };

    case 'ON_ORDER':
      return {
        label: 'Sur commande',
        classes: 'bg-blue-50 text-goi-blue',
        text: 'Contactez GOI pour confirmer le délai.',
      };

    case 'OUT_OF_STOCK':
      return {
        label: 'Indisponible',
        classes: 'bg-red-50 text-goi-danger',
        text: 'Ce produit ne peut pas être commandé pour le moment.',
      };

    default:
      return {
        label: status,
        classes: 'bg-goi-surface text-goi-muted',
        text: '',
      };
  }
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] =
    useState<CatalogProduct | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoadError('Produit introuvable.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setLoadError(null);

    getProduct(slug, controller.signal)
      .then((data) => {
        setProduct(data);
        setQuantity(Math.max(1, data.minOrderQty));
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
            : 'Impossible de charger ce produit.',
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

        <main className="bg-goi-surface py-12">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
          </div>
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

        <main className="bg-goi-surface py-16">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h1 className="text-3xl font-extrabold text-goi-navy">
                Produit indisponible
              </h1>

              <p className="mt-3 text-goi-muted">
                {loadError ??
                  'Ce produit ne peut pas être affiché.'}
              </p>

              <Link
                to="/produits"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-blue px-5 font-semibold text-white"
              >
                <ArrowLeft size={18} />
                Retour au catalogue
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </>
    );
  }

  const canAdd = isPurchasable(product);

  const availability = getAvailabilityMeta(
    product.availability,
  );

  function handleAddToCart() {
    if (!product || !canAdd || product.price === null) {
      return;
    }

    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-white">
        <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-10">
          <Link
            to="/produits"
            className="inline-flex items-center gap-2 text-sm font-semibold text-goi-muted transition hover:text-goi-blue"
          >
            <ArrowLeft size={16} />
            Retour au catalogue
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
            <section>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
                      <Package size={34} />
                    </div>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {product.sku}
                    </p>
                  </div>
                )}

                {product.featured && (
                  <span className="absolute left-5 top-5 rounded-full bg-goi-gold px-3 py-1 text-xs font-bold text-goi-navy">
                    Produit vedette
                  </span>
                )}
              </div>
            </section>

            <section className="lg:py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${availability.classes}`}
                >
                  {availability.label}
                </span>

                <span className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                  {product.sku}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-goi-navy sm:text-4xl">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="mt-4 text-base leading-7 text-goi-muted sm:text-lg">
                  {product.shortDescription}
                </p>
              )}

              <div className="mt-7 border-y border-slate-200 py-6">
                {product.price !== null ? (
                  <>
                    <p className="text-4xl font-black tracking-tight text-goi-navy">
                      {formatPrice(product.price)}
                      <span className="ml-2 text-xl">
                        FCFA
                      </span>
                    </p>

                    <p className="mt-2 text-sm font-medium text-goi-muted">
                      Prix par {product.unit}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-black text-goi-navy">
                    Prix sur devis
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                    Quantité minimale
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    {product.minOrderQty}{' '}
                    {product.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
                    Conditionnement
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    {product.packSize > 1
                      ? `${product.packSize} unités / pack`
                      : product.unit}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-goi-emerald"
                />

                <div>
                  <p className="font-semibold text-goi-navy">
                    {availability.label}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-goi-muted">
                    {availability.text}
                  </p>
                </div>
              </div>

              {canAdd && product.price !== null && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-goi-navy">
                    Quantité
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
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
                        className="flex size-11 items-center justify-center transition hover:bg-goi-surface"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus size={18} />
                      </button>

                      <span className="w-14 text-center font-bold text-goi-navy">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) => value + 1)
                        }
                        className="flex size-11 items-center justify-center transition hover:bg-goi-surface"
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

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {canAdd && product.price !== null ? (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {added ? (
                      <>
                        <Check size={19} />
                        Produit ajouté
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={19} />
                        Ajouter au panier
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to="/contact"
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-goi-blue px-6 font-semibold text-white"
                  >
                    Demander la disponibilité
                  </Link>
                )}

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-semibold text-goi-navy transition hover:bg-goi-surface"
                >
                  Demander un devis
                </Link>
              </div>
            </section>
          </div>

          <section className="mt-10 border-t border-slate-200 pt-10">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                Informations produit
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-goi-navy">
                Description
              </h2>

              <p className="mt-4 whitespace-pre-line leading-8 text-goi-muted">
                {product.description ??
                  product.shortDescription ??
                  'Les informations détaillées de ce produit seront complétées par GOI.'}
              </p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
