import {
  Package,
  ShoppingCart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  getAvailabilityLabel,
  getEffectivePrice,
  isPurchasable,
  type CatalogProduct,
} from '../../lib/catalog';

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    'fr-FR',
  ).format(value);
}

export function ProductCard({
  product,
}: {
  product: CatalogProduct;
}) {
  const { addItem } = useCart();

  const effectivePrice =
    getEffectivePrice(product);

  const canAdd =
    isPurchasable(product) &&
    effectivePrice !== null;

  function addToCart() {
    if (
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
      product.minOrderQty,
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#d8ded8] bg-white">
      <Link
        to={`/produits/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-goi-surface"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={
              product.mainMedia
                ?.alt ??
              product.name
            }
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package
              size={38}
              className="text-slate-300"
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.promotionActive && (
            <span className="rounded-full bg-goi-orange px-3 py-1 text-xs font-bold text-white">
              Promo
            </span>
          )}

          {product.availability ===
            'LOW_STOCK' && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Stock faible
            </span>
          )}

          {product.availability ===
            'ON_ORDER' && (
            <span className="rounded-full bg-goi-gold px-3 py-1 text-xs font-bold text-goi-navy">
              Sur commande
            </span>
          )}
        </div>
      </Link>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
          {product.brand ??
            product.category.name}
        </p>

        <Link
          to={`/produits/${product.slug}`}
        >
          <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-bold text-goi-navy">
            {product.name}
          </h3>
        </Link>

        <div className="mt-4">
          {effectivePrice !== null &&
          !product.priceOnRequest ? (
            <>
              {product.promotionActive &&
                product.price !== null && (
                  <p className="text-sm text-goi-muted line-through">
                    {formatPrice(
                      product.price,
                    )}{' '}
                    FCFA
                  </p>
                )}

              <p className="text-xl font-black text-goi-navy">
                {formatPrice(
                  effectivePrice,
                )}{' '}
                FCFA
              </p>

              <p className="mt-1 text-xs text-goi-muted">
                par {product.unit}
              </p>
            </>
          ) : (
            <p className="text-xl font-black text-goi-navy">
              Prix sur devis
            </p>
          )}
        </div>

        <p className="mt-3 text-sm text-goi-muted">
          {getAvailabilityLabel(
            product.availability,
          )}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            to={`/produits/${product.slug}`}
            className="flex min-h-11 items-center justify-center rounded-xl border border-[#d8ded8] px-3 text-sm font-bold text-goi-navy"
          >
            Voir
          </Link>

          {canAdd && (
            <button
              type="button"
              onClick={addToCart}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-goi-navy px-3 text-sm font-bold text-white"
            >
              <ShoppingCart
                size={16}
              />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
