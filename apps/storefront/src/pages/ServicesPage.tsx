import {
  ArrowRight,
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
  getServices,
  type PublicService,
} from '../lib/content';

export function ServicesPage() {
  const [services, setServices] =
    useState<PublicService[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    getServices(controller.signal)
      .then(setServices)
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
            : 'Impossible de charger les services.',
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
              Services
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">
              Nos services
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Découvrez les services
              actuellement proposés par GOI.
            </p>
          </div>
        </section>

        <section className="bg-goi-ivory py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-goi-danger">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-72 animate-pulse rounded-2xl bg-white"
                  />
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {services.map(
                  (service) => (
                    <article
                      key={service.id}
                      className="overflow-hidden rounded-2xl border border-[#d8ded8] bg-white"
                    >
                      {service.coverMedia
                        ?.secureUrl && (
                        <img
                          src={
                            service
                              .coverMedia
                              .secureUrl
                          }
                          alt={
                            service
                              .coverMedia
                              .alt ??
                            service.name
                          }
                          className="aspect-[16/9] w-full object-cover"
                        />
                      )}

                      <div className="p-6">
                        <h2 className="text-2xl font-bold text-goi-navy">
                          {service.name}
                        </h2>

                        {service.shortDescription && (
                          <p className="mt-3 leading-7 text-goi-muted">
                            {
                              service.shortDescription
                            }
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-4">
                          <Link
                            to={`/services/${service.slug}`}
                            className="inline-flex items-center gap-2 font-bold text-goi-blue"
                          >
                            Découvrir
                            <ArrowRight
                              size={17}
                            />
                          </Link>

                          <Link
                            to="/contact"
                            className="font-semibold text-goi-muted"
                          >
                            Demander un devis
                          </Link>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center text-goi-muted">
                Aucun service publié pour le moment.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
