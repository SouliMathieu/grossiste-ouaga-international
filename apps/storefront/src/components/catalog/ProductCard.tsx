import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  getAvailabilityLabel,
  isPurchasable,
  type CatalogProduct,
} from '../../lib/catalog';

type ProductCardProps = {
  product: CatalogProduct;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR').format(price);

export function ProductCard({
  product,
}: ProductCardProps) {
  const { addItem } = useCart();
  const canAdd = isPurchasable(product);

  const badge =
    product.availability === 'OUT_OF_STOCK'
      ? 'Rupture'
      : product.availability === 'ON_ORDER'
        ? 'Sur commande'
        : product.featured
          ? 'Vedette'
          : null;

  function handleAddToCart() {
    if (product.price === null || !canAdd) {
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
      product.minOrderQty,
    );
  }

  return (
    <article className="group overflow-hidden rounded-goi-lg border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-goi-2">
      <Link
        to={`/produit/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-slate-400">
            Visuel produit
          </span>
        )}

        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-goi-gold px-3 py-1 text-xs font-bold text-goi-navy">
            {badge}
          </span>
        )}
      </Link>

      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-goi-muted">
          {product.sku}
        </p>

        <Link to={`/produit/${product.slug}`}>
          <h3 className="mt-2 min-h-12 text-base font-bold leading-6 text-goi-navy transition group-hover:text-goi-blue">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-goi-muted">
          {product.category.name}
        </p>

        <p
          className={`mt-3 text-sm font-medium ${
            product.availability === 'OUT_OF_STOCK'
              ? 'text-goi-danger'
              : 'text-goi-emerald'
          }`}
        >
          {getAvailabilityLabel(product.availability)}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {product.price !== null ? (
              <>
                <p className="text-xl font-extrabold text-goi-navy">
                  {formatPrice(product.price)} FCFA
                </p>

                <p className="text-xs text-goi-muted">
                  / {product.unit}
                </p>
              </>
            ) : (
              <p className="font-bold text-goi-navy">
                Prix sur devis
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAddToCart}
            className="flex size-11 shrink-0 items-center justify-center rounded-goi-md bg-goi-blue text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingCart size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
