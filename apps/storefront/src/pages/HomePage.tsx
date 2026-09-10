import {
  ArrowRight,
  Cpu,
  House,
  MapPin,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/catalog/ProductCard';
import { HomeCarousel } from '../components/home/HomeCarousel';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import {
  getHomeContent,
  type HomeContent,
} from '../lib/content';
import {
  getProducts,
  type CatalogProduct,
} from '../lib/catalog';

const domains = [
  {
    title: 'Énergie solaire',
    text: 'Équipements et solutions liés à l’énergie solaire.',
    icon: Sun,
    query: 'solaire',
  },
  {
    title: 'Électricité',
    text: 'Matériels et équipements électriques.',
    icon: Zap,
    query: 'électricité',
  },
  {
    title: 'Électronique',
    text: 'Produits et équipements électroniques.',
    icon: Cpu,
    query: 'électronique',
  },
  {
    title: 'Électroménager',
    text: 'Équipements pour particuliers et professionnels.',
    icon: House,
    query: 'électroménager',
  },
];

const fallbackTrust = [
  {
    id: -1,
    title:
      'Produits et services au même endroit',
    description:
      'Découvrez vos équipements et sollicitez GOI pour vos besoins d’installation solaire ou électrique.',
  },
  {
    id: -2,
    title: 'Une offre diversifiée',
    description:
      'Solaire, électricité, électronique et électroménager réunis dans un même catalogue.',
  },
  {
    id: -3,
    title: 'Un interlocuteur local',
    description:
      'GOI exerce ses activités depuis Ouagadougou et reste facilement joignable pour vos demandes.',
  },
  {
    id: -4,
    title:
      'Un parcours adapté à votre besoin',
    description:
      'Consultez les produits, demandez un devis, commandez en ligne ou contactez directement GOI.',
  },
];

export function HomePage() {
  const [home, setHome] =
    useState<HomeContent>({
      slides: [],
      trustCards: [],
      services: [],
      realizations: [],
    });

  const [products, setProducts] =
    useState<CatalogProduct[]>([]);

  const [offers, setOffers] =
    useState<CatalogProduct[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    Promise.all([
      getHomeContent(
        controller.signal,
      ),
      getProducts(
        {
          sort: 'newest',
        },
        controller.signal,
      ),
    ])
      .then(
        ([
          homeData,
          productData,
        ]) => {
          setHome(homeData);

          const featured =
            productData.filter(
              (product) =>
                product.featured,
            );

          setProducts(
            (
              featured.length > 0
                ? featured
                : productData
            ).slice(0, 4),
          );

          setOffers(
            productData
              .filter(
                (product) =>
                  Boolean(
                    (
                      product as CatalogProduct & {
                        promotionActive?: boolean;
                      }
                    )
                      .promotionActive,
                  ),
              )
              .slice(0, 4),
          );
        },
      )
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
            : 'Impossible de charger l’accueil.',
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

  const trustItems =
    home.trustCards.length > 0
      ? home.trustCards
      : fallbackTrust;

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <HomeCarousel
          slides={home.slides}
        />

        {loadError && (
          <div className="border-b border-red-100 bg-red-50">
            <div className="mx-auto max-w-[1360px] px-4 py-3 text-sm font-medium text-goi-danger sm:px-6">
              {loadError}
            </div>
          </div>
        )}

        <section className="bg-goi-ivory py-14 sm:py-16">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                Nos domaines
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                Quatre univers pour vos besoins
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {domains.map(
                ({
                  title,
                  text,
                  icon: Icon,
                  query,
                }) => (
                  <Link
                    key={title}
                    to={`/produits?q=${encodeURIComponent(
                      query,
                    )}`}
                    className="group rounded-2xl border border-[#d8ded8] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-goi-gold text-goi-navy">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-goi-navy">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-goi-muted">
                      {text}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-goi-blue">
                      Découvrir
                      <ArrowRight
                        size={16}
                      />
                    </span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                  Catalogue
                </p>

                <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                  Produits à découvrir
                </h2>
              </div>

              <Link
                to="/produits"
                className="hidden items-center gap-2 font-bold text-goi-blue sm:flex"
              >
                Tout voir
                <ArrowRight size={17} />
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[370px] animate-pulse rounded-2xl bg-goi-surface"
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {products.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-goi-surface p-8 text-center text-goi-muted">
                Aucun produit publié pour le moment.
              </div>
            )}
          </div>
        </section>

        {home.services.length > 0 && (
          <section className="bg-goi-surface py-14 sm:py-16">
            <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                    Nos services
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                    GOI vous accompagne aussi sur le terrain
                  </h2>
                </div>

                <Link
                  to="/services"
                  className="hidden items-center gap-2 font-bold text-goi-blue sm:flex"
                >
                  Tous les services
                  <ArrowRight
                    size={17}
                  />
                </Link>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {home.services.map(
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
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover"
                        />
                      )}

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-goi-navy">
                          {service.name}
                        </h3>

                        {service.shortDescription && (
                          <p className="mt-2 text-sm leading-6 text-goi-muted">
                            {
                              service.shortDescription
                            }
                          </p>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bg-goi-navy py-14 text-white sm:py-16">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-gold">
                Pourquoi GOI
              </p>

              <h2 className="mt-2 text-3xl font-extrabold">
                Un parcours clair et adapté à votre besoin
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map(
                (item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <ShieldCheck
                      size={24}
                      className="text-goi-gold"
                    />

                    <h3 className="mt-4 font-bold">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {
                          item.description
                        }
                      </p>
                    )}
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        {home.realizations.length > 0 && (
          <section className="bg-white py-14 sm:py-16">
            <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                    Nos Réalisations
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                    Des projets réalisés sur le terrain
                  </h2>
                </div>

                <Link
                  to="/realisations"
                  className="hidden items-center gap-2 font-bold text-goi-blue sm:flex"
                >
                  Voir les réalisations
                  <ArrowRight
                    size={17}
                  />
                </Link>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {home.realizations.map(
                  (realization) => (
                    <article
                      key={
                        realization.id
                      }
                      className="overflow-hidden rounded-2xl border border-[#d8ded8] bg-goi-surface"
                    >
                      {realization
                        .coverMedia
                        ?.secureUrl && (
                        <img
                          src={
                            realization
                              .coverMedia
                              .secureUrl
                          }
                          alt={
                            realization
                              .coverMedia
                              .alt ??
                            realization.title
                          }
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
                      )}

                      <div className="p-5">
                        {realization.category
                          ?.name && (
                          <p className="text-xs font-bold uppercase tracking-wide text-goi-blue">
                            {
                              realization
                                .category
                                .name
                            }
                          </p>
                        )}

                        <h3 className="mt-1 font-bold text-goi-navy">
                          {
                            realization.title
                          }
                        </h3>

                        {realization.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-goi-muted">
                            <MapPin
                              size={15}
                            />
                            {
                              realization.location
                            }
                          </p>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {offers.length > 0 && (
          <section className="bg-goi-ivory py-14 sm:py-16">
            <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-orange">
                Offres du moment
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                Promotions actives
              </h2>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {offers.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                À propos de GOI
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                Vente d’équipements et installation à Ouagadougou
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-goi-muted">
                Grossiste Ouaga International
                est spécialisé dans la vente
                d’équipements solaires,
                électriques, électroniques et
                électroménagers. GOI réalise
                également des installations
                solaires et électriques afin
                d’accompagner ses clients
                selon leurs besoins.
              </p>

              <Link
                to="/a-propos"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-goi-blue"
              >
                Découvrir GOI
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="rounded-2xl bg-goi-surface p-7 sm:p-8">
              <MapPin
                size={30}
                className="text-goi-blue"
              />

              <h3 className="mt-4 text-xl font-bold text-goi-navy">
                Implanté à Ouagadougou
              </h3>

              <p className="mt-2 text-sm leading-6 text-goi-muted">
                Pour un besoin produit, une
                installation ou une demande
                de devis, contactez
                directement GOI.
              </p>

              <Link
                to="/contact"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-goi-navy px-5 font-bold text-white"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
