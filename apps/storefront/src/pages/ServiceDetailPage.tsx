import {
  ArrowLeft,
  ArrowRight,
  Images,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getRealizations,
  getService,
  type PublicRealization,
  type ServiceDetail,
} from '../lib/content';

export function ServiceDetailPage() {
  const { slug = '' } = useParams();

  const [service, setService] =
    useState<ServiceDetail | null>(
      null,
    );

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

    Promise.all([
      getService(
        slug,
        controller.signal,
      ),
      getRealizations(
        controller.signal,
      ),
    ])
      .then(
        ([
          serviceData,
          realizationData,
        ]) => {
          setService(
            serviceData ?? null,
          );

          setRealizations(
            realizationData.filter(
              (item) =>
                item.service?.slug ===
                slug,
            ),
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
            : 'Impossible de charger ce service.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () =>
      controller.abort();
  }, [slug]);

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        {isLoading ? (
          <div className="mx-auto min-h-[520px] max-w-[1360px] px-4 py-16 sm:px-6">
            <div className="h-96 animate-pulse rounded-2xl bg-goi-surface" />
          </div>
        ) : error || !service ? (
          <div className="mx-auto min-h-[520px] max-w-[1360px] px-4 py-16 sm:px-6">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8">
              <p className="font-semibold text-goi-danger">
                {error ??
                  'Ce service est introuvable.'}
              </p>

              <Link
                to="/services"
                className="mt-5 inline-flex items-center gap-2 font-bold text-goi-blue"
              >
                <ArrowLeft size={17} />
                Retour aux services
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="bg-goi-navy text-white">
              <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
                <div>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-goi-gold"
                  >
                    <ArrowLeft
                      size={16}
                    />
                    Services
                  </Link>

                  <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
                    {service.name}
                  </h1>

                  {service.shortDescription && (
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
                      {
                        service.shortDescription
                      }
                    </p>
                  )}

                  <Link
                    to="/contact"
                    className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-gold px-6 font-bold text-goi-navy"
                  >
                    Demander un devis
                    <ArrowRight
                      size={18}
                    />
                  </Link>
                </div>

                {service.coverMedia
                  ?.secureUrl && (
                  <img
                    src={
                      service.coverMedia
                        .secureUrl
                    }
                    alt={
                      service.coverMedia
                        .alt ??
                      service.name
                    }
                    className="aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                )}
              </div>
            </section>

            {service.description && (
              <section className="bg-white py-14">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  <div className="max-w-3xl">
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                      Présentation
                    </p>

                    <div className="mt-4 whitespace-pre-line text-base leading-8 text-goi-muted">
                      {
                        service.description
                      }
                    </div>
                  </div>
                </div>
              </section>
            )}

            {service.gallery.length >
              0 && (
              <section className="bg-goi-ivory py-14">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Images className="text-goi-blue" />

                    <h2 className="text-3xl font-extrabold text-goi-navy">
                      Galerie
                    </h2>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {service.gallery.map(
                      (item) => (
                        <img
                          key={item.id}
                          src={
                            item.media
                              .secureUrl
                          }
                          alt={
                            item.media
                              .alt ??
                            service.name
                          }
                          loading="lazy"
                          className="aspect-[4/3] w-full rounded-2xl object-cover"
                        />
                      ),
                    )}
                  </div>
                </div>
              </section>
            )}

            {realizations.length >
              0 && (
              <section className="bg-white py-14">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  <h2 className="text-3xl font-extrabold text-goi-navy">
                    Réalisations associées
                  </h2>

                  <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {realizations.map(
                      (item) => (
                        <Link
                          key={item.id}
                          to={`/realisations/${item.slug}`}
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
                            <h3 className="font-bold text-goi-navy">
                              {
                                item.title
                              }
                            </h3>
                          </div>
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </section>
            )}

            {service.products.length >
              0 && (
              <section className="bg-goi-surface py-14">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  <h2 className="text-3xl font-extrabold text-goi-navy">
                    Produits associés
                  </h2>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {service.products.map(
                      (product) => (
                        <Link
                          key={product.id}
                          to={`/produits/${product.slug}`}
                          className="rounded-xl border border-[#d8ded8] bg-white px-5 py-3 font-semibold text-goi-navy hover:text-goi-blue"
                        >
                          {product.name}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-goi-navy py-14 text-white">
              <div className="mx-auto max-w-[1360px] px-4 text-center sm:px-6">
                <h2 className="text-3xl font-extrabold">
                  Un projet à étudier ?
                </h2>

                <Link
                  to="/contact"
                  className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-goi-gold px-6 font-bold text-goi-navy"
                >
                  Contacter GOI
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
