import {
  MapPin,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getRealizations,
  type PublicRealization,
} from '../lib/content';

export function RealizationsPage() {
  const [
    realizations,
    setRealizations,
  ] = useState<
    PublicRealization[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    getRealizations(
      controller.signal,
    )
      .then(setRealizations)
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

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="bg-goi-navy py-14 text-white">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <p className="font-bold uppercase tracking-[0.12em] text-goi-gold">
              Projets
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">
              Nos Réalisations
            </h1>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
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
            ) : realizations.length >
              0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {realizations.map(
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
                        {item.category
                          ?.name && (
                          <p className="text-xs font-bold uppercase tracking-wide text-goi-blue">
                            {
                              item
                                .category
                                .name
                            }
                          </p>
                        )}

                        <h2 className="mt-1 text-xl font-bold text-goi-navy">
                          {item.title}
                        </h2>

                        {item.location && (
                          <p className="mt-3 flex items-center gap-2 text-sm text-goi-muted">
                            <MapPin
                              size={16}
                            />
                            {
                              item.location
                            }
                          </p>
                        )}

                        {item.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-goi-muted">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-goi-surface p-8 text-center text-goi-muted">
                Aucune réalisation publiée pour le moment.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
