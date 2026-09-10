import {
  ArrowRight,
  MapPin,
  Sun,
  Zap,
  Cpu,
  House,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCompany } from '../context/CompanyContext';
import {
  getAbout,
  getHomeContent,
  type AboutContent,
  type HomeContent,
} from '../lib/content';

const provisionalIntro =
  'Grossiste Ouaga International, ou GOI, est une entreprise basée à Ouagadougou spécialisée dans la vente d’équipements solaires, électriques, électroniques et électroménagers. Au-delà de la vente de produits, GOI réalise également des installations solaires et électriques afin d’accompagner ses clients dans la mise en place de solutions adaptées à leurs besoins.';

const defaultValues = [
  'Proximité',
  'Engagement',
  'Clarté',
];

const domains = [
  {
    name: 'Énergie solaire',
    icon: Sun,
  },
  {
    name: 'Électricité',
    icon: Zap,
  },
  {
    name: 'Électronique',
    icon: Cpu,
  },
  {
    name: 'Électroménager',
    icon: House,
  },
];

function stringList(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (item) => {
      if (typeof item === 'string') {
        return [item];
      }

      if (
        typeof item !== 'object' ||
        item === null
      ) {
        return [];
      }

      const record =
        item as Record<
          string,
          unknown
        >;

      const text =
        record.title ??
        record.name ??
        record.label ??
        record.text;

      return typeof text ===
        'string'
        ? [text]
        : [];
    },
  );
}

export function AboutPage() {
  const { company } = useCompany();

  const [about, setAbout] =
    useState<AboutContent | null>(
      null,
    );

  const [home, setHome] =
    useState<HomeContent | null>(
      null,
    );

  const [
    reduceMotion,
    setReduceMotion,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const media =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );

    const update = () =>
      setReduceMotion(
        media.matches,
      );

    update();

    media.addEventListener(
      'change',
      update,
    );

    return () =>
      media.removeEventListener(
        'change',
        update,
      );
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    Promise.all([
      getAbout(
        controller.signal,
      ),
      getHomeContent(
        controller.signal,
      ),
    ])
      .then(
        ([
          aboutData,
          homeData,
        ]) => {
          setAbout(aboutData);
          setHome(homeData);
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () =>
      controller.abort();
  }, []);

  const values =
    stringList(about?.values);

  const strengths =
    stringList(
      about?.strengths,
    );

  if (isLoading) {
    return (
      <>
        <TopBar />
        <SiteHeader />

        <main className="mx-auto min-h-[600px] max-w-[1360px] px-4 py-16 sm:px-6">
          <div className="h-96 animate-pulse rounded-2xl bg-goi-surface" />
        </main>

        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="relative flex min-h-[480px] items-center overflow-hidden bg-goi-navy text-white">
          {about?.heroPoster
            ?.secureUrl && (
            <img
              src={
                about.heroPoster
                  .secureUrl
              }
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {about?.heroVideo
            ?.secureUrl &&
            !reduceMotion && (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={
                  about.heroPoster
                    ?.secureUrl
                }
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source
                  src={
                    about.heroVideo
                      .secureUrl
                  }
                />
              </video>
            )}

          <div className="absolute inset-0 bg-goi-navy/80" />

          <div className="relative mx-auto w-full max-w-[1360px] px-4 py-16 sm:px-6">
            <p className="font-bold uppercase tracking-[0.12em] text-goi-gold">
              À propos
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold sm:text-5xl">
              {about?.heroTitle ??
                company?.businessName ??
                'Grossiste Ouaga International'}
            </h1>

            {about?.heroText && (
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                {about.heroText}
              </p>
            )}
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-goi-blue">
                Qui sommes-nous ?
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                {about?.introTitle ??
                  'À propos de GOI'}
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-goi-muted">
                {about?.introText ??
                  provisionalIntro}
              </p>
            </div>

            {about?.introMedia
              ?.secureUrl && (
              <img
                src={
                  about.introMedia
                    .secureUrl
                }
                alt={
                  about.introMedia.alt ??
                  'Grossiste Ouaga International'
                }
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            )}
          </div>
        </section>

        <section className="bg-goi-ivory py-14">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div className="rounded-2xl bg-goi-navy p-8 text-white">
              <MapPin
                size={32}
                className="text-goi-gold"
              />

              <h2 className="mt-5 text-3xl font-extrabold">
                {about?.implantationTitle ??
                  'Notre implantation'}
              </h2>

              <p className="mt-4 leading-7 text-white/75">
                {about?.implantationText ??
                  'GOI exerce ses activités depuis Ouagadougou, Burkina Faso.'}
              </p>

              {company?.mapsUrl && (
                <a
                  href={company.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-goi-gold px-5 font-bold text-goi-navy"
                >
                  Itinéraire
                  <ArrowRight
                    size={17}
                  />
                </a>
              )}
            </div>

            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-[#d8ded8] bg-white">
              <div className="text-center">
                <MapPin
                  size={44}
                  className="mx-auto text-goi-blue"
                />

                <p className="mt-4 text-xl font-bold text-goi-navy">
                  Ouagadougou
                </p>

                <p className="mt-1 text-goi-muted">
                  Burkina Faso
                </p>
              </div>
            </div>
          </div>
        </section>

        {about?.missionText && (
          <section className="bg-white py-14">
            <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-goi-navy">
                  {about.missionTitle ??
                    'Nos missions'}
                </h2>

                <p className="mt-5 whitespace-pre-line leading-8 text-goi-muted">
                  {about.missionText}
                </p>
              </div>

              {about.missionMedia
                ?.secureUrl && (
                <img
                  src={
                    about
                      .missionMedia
                      .secureUrl
                  }
                  alt={
                    about.missionMedia
                      .alt ??
                    'Mission GOI'
                  }
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </section>
        )}

        <section className="bg-goi-surface py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold text-goi-navy">
              {about?.valuesTitle ??
                'Nos valeurs'}
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {(values.length > 0
                ? values
                : defaultValues
              ).map((value) => (
                <article
                  key={value}
                  className="rounded-2xl bg-white p-6 text-center"
                >
                  <h3 className="text-xl font-bold text-goi-navy">
                    {value}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        {strengths.length > 0 && (
          <section className="bg-white py-14">
            <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
              {about?.strengthsMedia
                ?.secureUrl && (
                <img
                  src={
                    about
                      .strengthsMedia
                      .secureUrl
                  }
                  alt={
                    about
                      .strengthsMedia
                      .alt ??
                    'GOI'
                  }
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
              )}

              <div>
                <h2 className="text-3xl font-extrabold text-goi-navy">
                  {about?.strengthsTitle ??
                    'Nos atouts'}
                </h2>

                <ul className="mt-6 space-y-3">
                  {strengths.map(
                    (strength) => (
                      <li
                        key={strength}
                        className="rounded-xl bg-goi-surface p-4 font-semibold text-goi-navy"
                      >
                        {strength}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        <section className="bg-goi-ivory py-14">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <h2 className="text-3xl font-extrabold text-goi-navy">
              Nos domaines
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {domains.map(
                ({
                  name,
                  icon: Icon,
                }) => (
                  <div
                    key={name}
                    className="rounded-2xl bg-white p-5"
                  >
                    <Icon
                      className="text-goi-blue"
                    />

                    <p className="mt-4 font-bold text-goi-navy">
                      {name}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {home &&
          home.services.length >
            0 && (
            <section className="bg-white py-14">
              <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                <h2 className="text-3xl font-extrabold text-goi-navy">
                  Nos services
                </h2>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {home.services
                    .slice(0, 2)
                    .map(
                      (service) => (
                        <Link
                          key={
                            service.id
                          }
                          to={`/services/${service.slug}`}
                          className="rounded-2xl border border-[#d8ded8] p-6"
                        >
                          <h3 className="text-xl font-bold text-goi-navy">
                            {
                              service.name
                            }
                          </h3>

                          {service.shortDescription && (
                            <p className="mt-2 text-goi-muted">
                              {
                                service.shortDescription
                              }
                            </p>
                          )}
                        </Link>
                      ),
                    )}
                </div>
              </div>
            </section>
          )}

        {home &&
          home.realizations.length >
            0 && (
            <section className="bg-goi-surface py-14">
              <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                <h2 className="text-3xl font-extrabold text-goi-navy">
                  Nos Réalisations
                </h2>

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                  {home.realizations
                    .slice(0, 3)
                    .map(
                      (item) => (
                        <Link
                          key={item.id}
                          to={`/realisations/${item.slug}`}
                          className="overflow-hidden rounded-2xl bg-white"
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
                              className="aspect-[4/3] w-full object-cover"
                            />
                          )}

                          <div className="p-5 font-bold text-goi-navy">
                            {
                              item.title
                            }
                          </div>
                        </Link>
                      ),
                    )}
                </div>
              </div>
            </section>
          )}

        <section className="bg-goi-navy py-14 text-white">
          <div className="mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
            <h2 className="max-w-2xl text-3xl font-extrabold">
              Découvrez nos produits ou échangez avec GOI sur votre besoin.
            </h2>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/produits"
                className="rounded-xl bg-goi-gold px-5 py-3 font-bold text-goi-navy"
              >
                Voir les produits
              </Link>

              <Link
                to="/contact"
                className="rounded-xl border border-white/25 px-5 py-3 font-bold"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
