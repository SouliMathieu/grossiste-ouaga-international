import {
  ArrowRight,
  MapPin,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getRealizationCategories,
  getRealizations,
  type PublicRealization,
  type RealizationCategory,
} from '../lib/content';

export function RealizationsPage() {
  const [
    realizations,
    setRealizations,
  ] = useState<
    PublicRealization[]
  >([]);

  const [
    categories,
    setCategories,
  ] = useState<
    RealizationCategory[]
  >([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    Promise.all([
      getRealizations(
        controller.signal,
      ),
      getRealizationCategories(
        controller.signal,
      ),
    ])
      .then(
        ([
          realizationData,
          categoryData,
        ]) => {
          setRealizations(
            realizationData,
          );

          setCategories(
            categoryData,
          );
        },
      )
      .catch((caught: unknown) => {
        if (
          caught instanceof DOMException &&
          caught.name === 'AbortError'
        ) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les réalisations.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () =>
      controller.abort();
  }, []);

  const filtered =
    selectedCategory
      ? realizations.filter(
          (item) =>
            item.category.slug ===
            selectedCategory,
        )
      : realizations;

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="bg-goi-navy py-14 text-white">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <p className="font-bold uppercase tracking-[0.12em] text-goi-gold">
              Projets réalisés
            </p>

            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
              Nos Réalisations
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Découvrez les projets réellement
              publiés par GOI.
            </p>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            {categories.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      '',
                    )
                  }
                  className={[
                    'min-h-11 rounded-full px-5 text-sm font-bold',
                    selectedCategory ===
                    ''
                      ? 'bg-goi-navy text-white'
                      : 'bg-goi-surface text-goi-navy',
                  ].join(' ')}
                >
                  Toutes
                </button>

                {categories.map(
                  (category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category.slug,
                        )
                      }
                      className={[
                        'min-h-11 rounded-full px-5 text-sm font-bold',
                        selectedCategory ===
                        category.slug
                          ? 'bg-goi-navy text-white'
                          : 'bg-goi-surface text-goi-navy',
                      ].join(' ')}
                    >
                      {category.name}
                    </button>
                  ),
                )}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-goi-danger">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-80 animate-pulse rounded-2xl bg-goi-surface"
                    />
                  ),
                )}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-[#d8ded8] bg-white"
                    >
                      {item.coverMedia
                        ?.secureUrl && (
                        <img
                          src={
                            item
                              .coverMedia
                              .secureUrl
                          }
                          alt={
                            item
                              .coverMedia
                              .alt ??
                            item.title
                          }
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
                      )}

                      <div className="p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-goi-blue">
                          {
                            item.category
                              .name
                          }
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-goi-navy">
                          {item.title}
                        </h2>

                        {(item.location ||
                          item.projectYear) && (
                          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-goi-muted">
                            {item.location && (
                              <>
                                <MapPin
                                  size={15}
                                />
                                {
                                  item.location
                                }
                              </>
                            )}

                            {item.projectYear && (
                              <span>
                                {
                                  item.projectYear
                                }
                              </span>
                            )}
                          </p>
                        )}

                        {item.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-goi-muted">
                            {item.summary}
                          </p>
                        )}

                        <Link
                          to={`/realisations/${item.slug}`}
                          className="mt-5 inline-flex items-center gap-2 font-bold text-goi-blue"
                        >
                          Découvrir
                          <ArrowRight
                            size={17}
                          />
                        </Link>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-goi-surface p-8 text-center text-goi-muted">
                Aucune réalisation publiée dans cette catégorie.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
