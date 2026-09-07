import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  PackageSearch,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryCard } from '../components/catalog/CategoryCard';
import { ProductCard } from '../components/catalog/ProductCard';
import { B2BSection } from '../components/home/B2BSection';
import { PromoBanner } from '../components/home/PromoBanner';
import { WhyGOI } from '../components/home/WhyGOI';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getCategories,
  getProducts,
  type CatalogCategory,
  type CatalogProduct,
} from '../lib/catalog';

const services = [
  {
    icon: PackageSearch,
    title: 'Catalogue structuré',
    text: 'Références et disponibilités clairement présentées.',
  },
  {
    icon: ShoppingBag,
    title: 'Commande en ligne',
    text: 'Préparez votre panier depuis le catalogue GOI.',
  },
  {
    icon: CreditCard,
    title: 'Paiement adapté',
    text: 'Plusieurs moyens de paiement selon votre commande.',
  },
  {
    icon: Truck,
    title: 'Livraison ou retrait',
    text: 'Choisissez le mode qui correspond à votre besoin.',
  },
];

export function HomePage() {
  const [categories, setCategories] = useState<
    CatalogCategory[]
  >([]);

  const [products, setProducts] = useState<
    CatalogProduct[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getCategories(controller.signal),
      getProducts(
        {
          featured: true,
          sort: 'newest',
        },
        controller.signal,
      ),
    ])
      .then(([categoryData, productData]) => {
        setCategories(categoryData.slice(0, 4));
        setProducts(productData.slice(0, 4));
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
            : 'Impossible de charger le catalogue.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-goi-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_32%)]" />

          <div className="relative mx-auto grid max-w-[1360px] gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-goi-gold">
                <BadgeCheck size={16} />
                Grossiste & distribution à Ouagadougou
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
                Des produits fiables.
                <span className="block text-goi-gold">
                  Des commandes simples.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Découvrez le catalogue GOI, consultez les
                références disponibles et préparez votre commande
                directement en ligne.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/produits"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
                >
                  Voir le catalogue
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center rounded-xl border border-white/20 bg-white/5 px-6 font-semibold text-white transition hover:bg-white/10"
                >
                  Demander un devis
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur sm:p-6">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-goi-gold">
                  Votre parcours GOI
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Commander en toute simplicité
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {services.map(({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="rounded-xl border border-white/10 bg-white/[0.045] p-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-goi-gold text-goi-navy">
                      <Icon size={19} />
                    </div>

                    <h3 className="mt-4 font-bold">
                      {title}
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-slate-300">
                      {text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loadError && (
          <section className="border-b border-red-100 bg-red-50 py-3">
            <div className="mx-auto max-w-[1360px] px-4 text-sm font-medium text-goi-danger sm:px-6">
              {loadError}
            </div>
          </section>
        )}

        <section className="bg-goi-surface py-12 sm:py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                  Catégories
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-goi-navy sm:text-3xl">
                  Explorez notre catalogue
                </h2>

                <p className="mt-2 max-w-2xl text-goi-muted">
                  Accédez rapidement aux familles de produits
                  disponibles chez GOI.
                </p>
              </div>

              <Link
                to="/produits"
                className="hidden items-center gap-2 text-sm font-semibold text-goi-blue hover:underline sm:flex"
              >
                Tout le catalogue
                <ArrowRight size={17} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-44 animate-pulse rounded-2xl bg-white"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    {...category}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
                  Sélection GOI
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-goi-navy sm:text-3xl">
                  Produits à découvrir
                </h2>
              </div>

              <Link
                to="/produits"
                className="hidden items-center gap-2 text-sm font-semibold text-goi-blue hover:underline sm:flex"
              >
                Voir tous les produits
                <ArrowRight size={17} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[370px] animate-pulse rounded-2xl bg-goi-surface"
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-goi-surface p-8 text-center">
                <p className="font-semibold text-goi-navy">
                  Aucun produit mis en avant pour le moment.
                </p>
              </div>
            )}
          </div>
        </section>

        <WhyGOI />
        <PromoBanner />
        <B2BSection />
      </main>

      <SiteFooter />
    </>
  );
}
