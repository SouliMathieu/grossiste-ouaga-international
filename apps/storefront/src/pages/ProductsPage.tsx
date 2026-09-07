import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/catalog/ProductCard';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getCategories,
  getProducts,
  type CatalogCategory,
  type CatalogProduct,
} from '../lib/catalog';

type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc';

export function ProductsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const category =
    searchParams.get('categorie') ?? 'all';

  const [search, setSearch] = useState('');
  const [sort, setSort] =
    useState<SortOption>('newest');

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

    getCategories(controller.signal)
      .then(setCategories)
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
            : 'Impossible de récupérer les catégories.',
        );
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError(null);

      void getProducts(
        {
          ...(search.trim()
            ? { q: search.trim() }
            : {}),
          ...(category !== 'all'
            ? { category }
            : {}),
          sort,
        },
        controller.signal,
      )
        .then(setProducts)
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
              : 'Impossible de récupérer les produits.',
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, sort]);

  function selectCategory(slug: string) {
    const next = new URLSearchParams(searchParams);

    if (slug === 'all') {
      next.delete('categorie');
    } else {
      next.set('categorie', slug);
    }

    setSearchParams(next);
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-goi-surface">
          <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
            <p className="font-semibold text-goi-blue">
              Catalogue
            </p>

            <h1 className="mt-2 text-4xl font-extrabold text-goi-navy">
              Nos produits
            </h1>

            <p className="mt-3 max-w-2xl text-goi-muted">
              Recherchez et filtrez les produits disponibles
              chez GOI.
            </p>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-goi-muted"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Rechercher un produit, une référence..."
                  className="h-12 w-full rounded-goi-md border border-slate-200 bg-goi-surface pl-12 pr-12 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Effacer la recherche"
                    className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-goi-muted hover:bg-slate-200"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target.value as SortOption,
                  )
                }
                className="h-12 rounded-goi-md border border-slate-200 bg-white px-4 text-goi-slate outline-none focus:border-goi-blue"
              >
                <option value="newest">
                  Plus récents
                </option>
                <option value="price_asc">
                  Prix croissant
                </option>
                <option value="price_desc">
                  Prix décroissant
                </option>
                <option value="name_asc">
                  Nom A–Z
                </option>
              </select>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => selectCategory('all')}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  category === 'all'
                    ? 'bg-goi-blue text-white'
                    : 'bg-goi-surface text-goi-slate'
                }`}
              >
                Tous
              </button>

              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    selectCategory(item.slug)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    category === item.slug
                      ? 'bg-goi-blue text-white'
                      : 'bg-goi-surface text-goi-slate'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {!isLoading && !loadError && (
              <p className="mt-6 text-sm text-goi-muted">
                {products.length} produit
                {products.length !== 1 ? 's' : ''}
              </p>
            )}

            {loadError && (
              <div
                role="alert"
                className="mt-8 rounded-goi-lg border border-red-200 bg-red-50 p-6 text-goi-danger"
              >
                {loadError}
              </div>
            )}

            {isLoading && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[390px] animate-pulse rounded-goi-lg bg-goi-surface"
                    />
                  ),
                )}
              </div>
            )}

            {!isLoading &&
              !loadError &&
              products.length > 0 && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              )}

            {!isLoading &&
              !loadError &&
              products.length === 0 && (
                <div className="mt-8 rounded-goi-lg border border-slate-200 bg-goi-surface p-8 text-center">
                  <h2 className="font-bold text-goi-navy">
                    Aucun produit trouvé
                  </h2>

                  <p className="mt-2 text-sm text-goi-muted">
                    Modifiez votre recherche ou retirez le
                    filtre de catégorie.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      selectCategory('all');
                    }}
                    className="mt-5 rounded-goi-md bg-goi-blue px-5 py-3 font-semibold text-white"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
