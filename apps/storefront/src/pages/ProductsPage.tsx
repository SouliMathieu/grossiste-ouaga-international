import {
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
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

  const queryFromUrl = searchParams.get('q') ?? '';

  const [search, setSearch] = useState(queryFromUrl);
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
    setSearch(queryFromUrl);
  }, [queryFromUrl]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      const normalized = search.trim();

      if (normalized) {
        next.set('q', normalized);
      } else {
        next.delete('q');
      }

      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, searchParams, setSearchParams]);

  const selectedCategoryName = useMemo(() => {
    if (category === 'all') {
      return 'Tous les produits';
    }

    return (
      categories.find((item) => item.slug === category)
        ?.name ?? 'Catalogue'
    );
  }, [categories, category]);

  function selectCategory(slug: string) {
    const next = new URLSearchParams(searchParams);

    if (slug === 'all') {
      next.delete('categorie');
    } else {
      next.set('categorie', slug);
    }

    setSearchParams(next);
  }

  function resetFilters() {
    setSearch('');
    setSort('newest');
    setSearchParams({});
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-goi-surface">
          <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6 sm:py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-goi-blue">
              Catalogue GOI
            </p>

            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-goi-navy sm:text-4xl">
                  Nos produits
                </h1>

                <p className="mt-3 max-w-2xl text-goi-muted">
                  Recherchez une référence, parcourez les
                  catégories et préparez votre commande.
                </p>
              </div>

              {!isLoading && !loadError && (
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-goi-slate">
                  {products.length} produit
                  {products.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
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
                    placeholder="Produit, référence, mot-clé..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-goi-surface pl-12 pr-12 outline-none transition focus:border-goi-blue focus:bg-white focus:ring-2 focus:ring-goi-blue/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Effacer la recherche"
                      className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-goi-muted hover:bg-slate-200"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={18}
                    className="hidden text-goi-muted sm:block"
                  />

                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target.value as SortOption,
                      )
                    }
                    aria-label="Trier les produits"
                    className="h-12 min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-goi-slate outline-none focus:border-goi-blue lg:flex-none"
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
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-goi-muted">
                  Catégories
                </p>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => selectCategory('all')}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      category === 'all'
                        ? 'bg-goi-navy text-white'
                        : 'bg-goi-surface text-goi-slate hover:bg-slate-200'
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
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        category === item.slug
                          ? 'bg-goi-navy text-white'
                          : 'bg-goi-surface text-goi-slate hover:bg-slate-200'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-goi-navy">
                  {selectedCategoryName}
                </p>

                {(search || category !== 'all') && (
                  <p className="mt-1 text-xs text-goi-muted">
                    Résultats correspondant à vos filtres
                  </p>
                )}
              </div>

              {(search ||
                category !== 'all' ||
                sort !== 'newest') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-goi-blue hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {loadError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-goi-danger"
              >
                {loadError}
              </div>
            )}

            {isLoading && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[370px] animate-pulse rounded-2xl bg-goi-surface"
                    />
                  ),
                )}
              </div>
            )}

            {!isLoading &&
              !loadError &&
              products.length > 0 && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <div className="mt-6 rounded-2xl border border-slate-200 bg-goi-surface px-6 py-14 text-center">
                  <Search
                    size={30}
                    className="mx-auto text-goi-muted"
                  />

                  <h2 className="mt-4 text-lg font-bold text-goi-navy">
                    Aucun produit trouvé
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-goi-muted">
                    Essayez une autre recherche ou retirez
                    certains filtres.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 rounded-xl bg-goi-blue px-5 py-3 text-sm font-semibold text-white"
                  >
                    Réinitialiser les filtres
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
