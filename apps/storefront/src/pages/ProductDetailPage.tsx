import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Maximize2,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import { ProductCard } from '../components/catalog/ProductCard';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCart } from '../context/CartContext';
import { useCompany } from '../context/CompanyContext';
import {
  getEffectivePrice,
  getProduct,
  getProducts,
  isPurchasable,
  type CatalogMediaAsset,
  type CatalogProduct,
} from '../lib/catalog';
import {
  getWhatsAppUrl,
} from '../lib/content';

function formatPrice(
  price: number,
) {
  return new Intl.NumberFormat(
    'fr-FR',
  ).format(price);
}

function formatBytes(
  bytes: number | null,
) {
  if (!bytes) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

function getAvailabilityMeta(
  status: string,
) {
  switch (status) {
    case 'IN_STOCK':
      return {
        label: 'Disponible',
        classes:
          'bg-emerald-50 text-emerald-800',
        text:
          'Ce produit peut être commandé actuellement.',
      };

    case 'LOW_STOCK':
      return {
        label: 'Stock faible',
        classes:
          'bg-amber-50 text-amber-800',
        text:
          'La disponibilité peut évoluer rapidement.',
      };

    case 'ON_ORDER':
      return {
        label: 'Sur commande',
        classes:
          'bg-goi-ivory text-goi-navy',
        text:
          'Contactez GOI pour confirmer la disponibilité et le délai.',
      };

    case 'OUT_OF_STOCK':
      return {
        label: 'Indisponible',
        classes:
          'bg-red-50 text-goi-danger',
        text:
          'Ce produit ne peut pas être commandé pour le moment.',
      };

    default:
      return {
        label: status,
        classes:
          'bg-goi-surface text-goi-muted',
        text: '',
      };
  }
}

export function ProductDetailPage() {
  const { slug } = useParams();

  const { addItem } = useCart();

  const { company } = useCompany();

  const [product, setProduct] =
    useState<CatalogProduct | null>(
      null,
    );

  const [
    similarProducts,
    setSimilarProducts,
  ] = useState<CatalogProduct[]>(
    [],
  );

  const [
    selectedMediaId,
    setSelectedMediaId,
  ] = useState<number | null>(
    null,
  );

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  const [quantity, setQuantity] =
    useState(1);

  const [added, setAdded] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const touchStart =
    useRef<number | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoadError(
        'Produit introuvable.',
      );
      setIsLoading(false);
      return;
    }

    const controller =
      new AbortController();

    setIsLoading(true);
    setLoadError(null);

    getProduct(
      slug,
      controller.signal,
    )
      .then(async (data) => {
        setProduct(data);

        setQuantity(
          Math.max(
            1,
            data.minOrderQty,
          ),
        );

        setSelectedMediaId(
          data.mainMedia?.id ??
            data.galleryMedia[0]
              ?.id ??
            null,
        );

        const related =
          await getProducts(
            {
              category:
                data.category.slug,
              sort: 'newest',
            },
            controller.signal,
          );

        setSimilarProducts(
          related
            .filter(
              (item) =>
                item.id !== data.id,
            )
            .slice(0, 4),
        );
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

    return () =>
      controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    function handleKeydown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
      }
    }

    window.addEventListener(
      'keydown',
      handleKeydown,
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeydown,
      );
  }, [lightboxOpen]);

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

  if (
    loadError ||
    !product
  ) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="bg-goi-surface py-16">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <div className="rounded-2xl bg-white p-8">
              <h1 className="text-3xl font-extrabold text-goi-navy">
                Produit indisponible
              </h1>

              <p className="mt-3 text-goi-muted">
                {loadError ??
                  'Ce produit ne peut pas être affiché.'}
              </p>

              <Link
                to="/produits"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-navy px-5 font-semibold text-white"
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

  const uniqueImages: CatalogMediaAsset[] =
    [
      ...(product.mainMedia
        ? [product.mainMedia]
        : []),
      ...product.galleryMedia,
    ].filter(
      (
        item,
        index,
        collection,
      ) =>
        collection.findIndex(
          (candidate) =>
            candidate.id ===
            item.id,
        ) === index,
    );

  const selectedImage =
    uniqueImages.find(
      (item) =>
        item.id ===
        selectedMediaId,
    ) ??
    uniqueImages[0] ??
    null;

  const effectivePrice =
    getEffectivePrice(product);

  const canAdd =
    isPurchasable(product) &&
    effectivePrice !== null;

  const availability =
    getAvailabilityMeta(
      product.availability,
    );

  const whatsappUrl =
    getWhatsAppUrl(
      company?.whatsapp,
      `Bonjour GOI, je souhaite avoir des informations sur le produit "${product.name}" (${product.sku}).`,
    );

  function selectRelativeImage(
    direction: -1 | 1,
  ) {
    if (
      uniqueImages.length <= 1
    ) {
      return;
    }

    const current =
      uniqueImages.findIndex(
        (item) =>
          item.id ===
          selectedImage?.id,
      );

    const next =
      (
        (
          current < 0
            ? 0
            : current
        ) +
        direction +
        uniqueImages.length
      ) %
      uniqueImages.length;

    setSelectedMediaId(
      uniqueImages[next]!.id,
    );
  }

  function handleAddToCart() {
    if (
      !product ||
      !canAdd ||
      effectivePrice === null
    ) {
      return;
    }

    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: effectivePrice,
        unit: product.unit,
      },
      quantity,
    );

    setAdded(true);

    window.setTimeout(
      () =>
        setAdded(false),
      1800,
    );
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-white">
        <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-10">
          <nav
            aria-label="Fil d’Ariane"
            className="flex flex-wrap items-center gap-2 text-sm text-goi-muted"
          >
            <Link
              to="/"
              className="hover:text-goi-blue"
            >
              Accueil
            </Link>

            <span>/</span>

            <Link
              to={`/produits?category=${encodeURIComponent(
                product.category.slug,
              )}`}
              className="hover:text-goi-blue"
            >
              {product.category.name}
            </Link>

            <span>/</span>

            <span className="text-goi-navy">
              {product.name}
            </span>
          </nav>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
            <section>
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#d8ded8] bg-goi-surface"
                onTouchStart={(event) => {
                  touchStart.current =
                    event.touches[0]
                      ?.clientX ??
                    null;
                }}
                onTouchEnd={(event) => {
                  if (
                    touchStart.current ===
                    null
                  ) {
                    return;
                  }

                  const end =
                    event
                      .changedTouches[0]
                      ?.clientX ?? 0;

                  const distance =
                    end -
                    touchStart.current;

                  touchStart.current =
                    null;

                  if (
                    Math.abs(distance) >
                    50
                  ) {
                    selectRelativeImage(
                      distance > 0
                        ? -1
                        : 1,
                    );
                  }
                }}
              >
                {selectedImage ? (
                  <img
                    src={
                      selectedImage.secureUrl
                    }
                    alt={
                      selectedImage.alt ??
                      product.name
                    }
                    className="h-full w-full object-contain p-4"
                  />
                ) : product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package
                      size={44}
                      className="text-slate-300"
                    />
                  </div>
                )}

                {selectedImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxOpen(
                        true,
                      )
                    }
                    className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-white shadow"
                    aria-label="Agrandir l’image"
                  >
                    <Maximize2
                      size={19}
                    />
                  </button>
                )}

                {product.promotionActive && (
                  <span className="absolute left-4 top-4 rounded-full bg-goi-orange px-3 py-1 text-sm font-bold text-white">
                    Promo
                  </span>
                )}
              </div>

              {uniqueImages.length >
                1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {uniqueImages.map(
                    (image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() =>
                          setSelectedMediaId(
                            image.id,
                          )
                        }
                        className={[
                          'size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-goi-surface',
                          selectedImage
                            ?.id ===
                          image.id
                            ? 'border-goi-blue'
                            : 'border-transparent',
                        ].join(' ')}
                        aria-label="Afficher cette image"
                      >
                        <img
                          src={
                            image.secureUrl
                          }
                          alt={
                            image.alt ??
                            ''
                          }
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ),
                  )}
                </div>
              )}
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

              <p className="mt-5 text-sm font-bold uppercase tracking-wide text-goi-blue">
                {product.brand ??
                  product.category.name}
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-goi-navy sm:text-4xl">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="mt-4 text-base leading-7 text-goi-muted sm:text-lg">
                  {product.shortDescription}
                </p>
              )}

              <div className="mt-7 border-y border-[#d8ded8] py-6">
                {product.priceOnRequest ||
                effectivePrice === null ? (
                  <p className="text-3xl font-black text-goi-navy">
                    Prix sur devis
                  </p>
                ) : (
                  <>
                    {product.promotionActive &&
                      product.price !==
                        null && (
                      <p className="mb-1 text-lg text-goi-muted line-through">
                        {formatPrice(
                          product.price,
                        )}{' '}
                        FCFA
                      </p>
                    )}

                    <p className="text-4xl font-black tracking-tight text-goi-navy">
                      {formatPrice(
                        effectivePrice,
                      )}
                      <span className="ml-2 text-xl">
                        FCFA
                      </span>
                    </p>

                    <p className="mt-2 text-sm text-goi-muted">
                      Prix par{' '}
                      {product.unit}
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase text-goi-muted">
                    Quantité minimale
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    {product.minOrderQty}{' '}
                    {product.unit}
                  </p>
                </div>

                <div className="rounded-xl bg-goi-surface p-4">
                  <p className="text-xs font-semibold uppercase text-goi-muted">
                    Conditionnement
                  </p>

                  <p className="mt-1 font-bold text-goi-navy">
                    {product.packSize >
                    1
                      ? `${product.packSize} unités / pack`
                      : product.unit}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d8ded8] p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-goi-blue"
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

              {canAdd && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-goi-navy">
                    Quantité
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center overflow-hidden rounded-xl border border-[#d8ded8]">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            (value) =>
                              Math.max(
                                product.minOrderQty,
                                value - 1,
                              ),
                          )
                        }
                        className="flex size-11 items-center justify-center"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus
                          size={18}
                        />
                      </button>

                      <span className="w-14 text-center font-bold">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            (value) =>
                              value + 1,
                          )
                        }
                        className="flex size-11 items-center justify-center"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus
                          size={18}
                        />
                      </button>
                    </div>

                    <span className="text-sm text-goi-muted">
                      {product.unit}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {canAdd && (
                  <button
                    type="button"
                    onClick={
                      handleAddToCart
                    }
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-goi-navy px-5 font-bold text-white"
                  >
                    {added ? (
                      <>
                        <Check
                          size={18}
                        />
                        Produit ajouté
                      </>
                    ) : (
                      <>
                        <ShoppingCart
                          size={18}
                        />
                        Ajouter au panier
                      </>
                    )}
                  </button>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-goi-gold px-5 font-bold text-goi-navy"
                  >
                    <MessageCircle
                      size={18}
                    />
                    WhatsApp
                  </a>
                )}

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d8ded8] px-5 font-bold text-goi-navy"
                >
                  Demander un devis
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-12 grid gap-8 border-t border-[#d8ded8] pt-10 lg:grid-cols-[1fr_0.8fr]">
            <section>
              <p className="text-sm font-bold uppercase tracking-wide text-goi-blue">
                Informations produit
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-goi-navy">
                Description
              </h2>

              <p className="mt-4 whitespace-pre-line leading-8 text-goi-muted">
                {product.description ??
                  product.shortDescription ??
                  'Aucune description détaillée publiée.'}
              </p>
            </section>

            <div className="space-y-6">
              {product.attributes.length >
                0 && (
                <section className="rounded-2xl bg-goi-surface p-6">
                  <h2 className="text-xl font-extrabold text-goi-navy">
                    Caractéristiques
                  </h2>

                  <dl className="mt-4 divide-y divide-[#d8ded8]">
                    {product.attributes.map(
                      (attribute) => (
                        <div
                          key={
                            attribute.id
                          }
                          className="grid grid-cols-2 gap-4 py-3"
                        >
                          <dt className="text-sm text-goi-muted">
                            {
                              attribute.name
                            }
                          </dt>

                          <dd className="text-sm font-semibold text-goi-navy">
                            {
                              attribute.value
                            }
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </section>
              )}

              {product.datasheetMedia && (
                <section className="rounded-2xl border border-[#d8ded8] p-6">
                  <FileText
                    size={26}
                    className="text-goi-blue"
                  />

                  <h2 className="mt-3 text-xl font-extrabold text-goi-navy">
                    Fiche technique
                  </h2>

                  <p className="mt-2 text-sm text-goi-muted">
                    Document PDF
                    {formatBytes(
                      product
                        .datasheetMedia
                        .bytes,
                    )
                      ? ` • ${formatBytes(
                          product
                            .datasheetMedia
                            .bytes,
                        )}`
                      : ''}
                  </p>

                  <a
                    href={
                      product
                        .datasheetMedia
                        .secureUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-goi-navy px-5 font-bold text-white"
                  >
                    <Download
                      size={17}
                    />
                    Télécharger le PDF
                  </a>
                </section>
              )}
            </div>
          </div>

          {similarProducts.length >
            0 && (
            <section className="mt-14 border-t border-[#d8ded8] pt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-goi-blue">
                    À découvrir
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                    Produits similaires
                  </h2>
                </div>

                <Link
                  to={`/produits?category=${encodeURIComponent(
                    product
                      .category.slug,
                  )}`}
                  className="hidden font-bold text-goi-blue sm:block"
                >
                  Voir la catégorie
                </Link>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {similarProducts.map(
                  (item) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                    />
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />

      {lightboxOpen &&
        selectedImage && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image agrandie du produit"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          >
            <button
              type="button"
              onClick={() =>
                setLightboxOpen(false)
              }
              className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white"
              aria-label="Fermer"
            >
              <X size={22} />
            </button>

            <img
              src={
                selectedImage.secureUrl
              }
              alt={
                selectedImage.alt ??
                product.name
              }
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        )}
    </>
  );
}
