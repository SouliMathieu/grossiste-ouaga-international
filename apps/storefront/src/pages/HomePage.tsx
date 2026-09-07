import { ArrowRight } from 'lucide-react';
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
        <section className="bg-goi-navy text-white">
          <div className="mx-auto grid min-h-[560px] max-w-[1360px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <p className="mb-4 font-semibold text-goi-gold">
                Grossiste Ouaga International
              </p>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Vos produits en gros, simplement et
                rapidement.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Découvrez notre catalogue, comparez les
                produits et préparez vos commandes
                directement en ligne.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/produits"
                  className="inline-flex min-h-12 items-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
                >
                  Voir le catalogue
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center rounded-goi-md border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
                >
                  Demander un devis
                </Link>
              </div>
            </div>

            <div className="rounded-goi-lg border border-white/10 bg-white/5 p-8 shadow-goi-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-goi-gold">
                GOI
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Commerce & distribution
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                Catalogue professionnel, commande en ligne
                et moyens de paiement adaptés au marché
                local.
              </p>
            </div>
          </div>
        </section>

        {loadError && (
          <section className="bg-red-50 py-4">
            <div className="mx-auto max-w-[1360px] px-4 text-sm font-medium text-goi-danger sm:px-6">
              {loadError}
            </div>
          </section>
        )}

        <section className="bg-goi-surface py-16 sm:py-20">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-semibold text-goi-blue">
                  Nos catégories
                </p>

                <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                  Trouvez rapidement ce qu’il vous faut
                </h2>
              </div>

              <Link
                to="/produits"
                className="hidden items-center gap-2 font-semibold text-goi-blue sm:flex"
              >
                Toutes les catégories
                <ArrowRight size={18} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-52 animate-pulse rounded-goi-lg bg-white"
                    />
                  ),
                )}
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

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-semibold text-goi-blue">
                  Sélection du moment
                </p>

                <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                  Produits à découvrir
                </h2>
              </div>

              <Link
                to="/produits"
                className="hidden items-center gap-2 font-semibold text-goi-blue sm:flex"
              >
                Voir le catalogue
                <ArrowRight size={18} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[390px] animate-pulse rounded-goi-lg bg-goi-surface"
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <PromoBanner />
        <WhyGOI />
        <B2BSection />
      </main>

      <SiteFooter />
    </>
  );
}
