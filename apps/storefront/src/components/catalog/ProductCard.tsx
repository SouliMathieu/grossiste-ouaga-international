import {
  ArrowUpRight,
  Check,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  isPurchasable,
  type CatalogProduct,
} from '../../lib/catalog';

type ProductCardProps = {
  product: CatalogProduct;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

function getAvailabilityMeta(status: string) {
  switch (status) {
    case 'IN_STOCK':
      return {
        label: 'Disponible',
        classes: 'bg-emerald-50 text-goi-emerald',
      };

    case 'LOW_STOCK':
      return {
        label: 'Stock limité',
        classes: 'bg-amber-50 text-amber-700',
      };

    case 'ON_ORDER':
      return {
        label: 'Sur commande',
        classes: 'bg-blue-50 text-goi-blue',
      };

    case 'OUT_OF_STOCK':
      return {
        label: 'Indisponible',
        classes: 'bg-red-50 text-goi-danger',
      };

    default:
      return {
        label: status,
        classes: 'bg-goi-surface text-goi-muted',
      };
  }
}

export function ProductCard({
  product,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const availability = getAvailabilityMeta(
    product.availability,
  );

  const canAdd = isPurchasable(product);

  function handleAddToCart() {
    if (!canAdd || product.price === null) {
      return;
    }

    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: Math.max(1, product.minOrderQty),
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1600);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <Link
        to={`/produit/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
              <Package size={28} />
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.featured && (
            <span className="rounded-full bg-goi-gold px-3 py-1 text-xs font-bold text-goi-navy shadow-sm">
              Vedette
            </span>
          )}

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${availability.classes}`}
          >
            {availability.label}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-goi-muted">
          {product.sku}
        </p>

        <Link
          to={`/produit/${product.slug}`}
          className="mt-2 line-clamp-2 text-lg font-bold leading-6 text-goi-navy transition hover:text-goi-blue"
        >
          {product.name}
        </Link>

        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-goi-muted">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-5">
          {product.price !== null ? (
            <>
              <p className="text-2xl font-extrabold tracking-tight text-goi-navy">
                {formatPrice(product.price)}
                <span className="ml-1 text-base font-bold">
                  FCFA
                </span>
              </p>

              <p className="mt-1 text-xs font-medium text-goi-muted">
                / {product.unit}
                {product.packSize > 1
                  ? ` · pack de ${product.packSize}`
                  : ''}
              </p>
            </>
          ) : (
            <p className="text-xl font-extrabold text-goi-navy">
              Prix sur devis
            </p>
          )}
        </div>

        {product.minOrderQty > 1 && (
          <p className="mt-3 text-xs text-goi-muted">
            Minimum : {product.minOrderQty}{' '}
            {product.unit}
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-5">
          {canAdd && product.price !== null ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-goi-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-goi-blue focus:ring-offset-2"
            >
              {added ? (
                <>
                  <Check size={17} />
                  Ajouté
                </>
              ) : (
                <>
                  <ShoppingCart size={17} />
                  Ajouter
                </>
              )}
            </button>
          ) : (
            <Link
              to={`/produit/${product.slug}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-goi-navy px-4 text-sm font-semibold text-white"
            >
              Voir le produit
            </Link>
          )}

          <Link
            to={`/produit/${product.slug}`}
            aria-label={`Voir ${product.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-goi-navy transition hover:bg-goi-surface"
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
