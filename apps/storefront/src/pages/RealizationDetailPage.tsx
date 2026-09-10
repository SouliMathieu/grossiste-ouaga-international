import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
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
  getRealization,
  type ContentMedia,
  type RealizationDetail,
} from '../lib/content';

type TechnicalItem = {
  name: string;
  value: string;
};

function normalizeTechnicalAttributes(
  value: unknown,
): TechnicalItem[] {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(
      (item) => {
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

        const name =
          record.name ??
          record.label ??
          record.key;

        const itemValue =
          record.value ??
          record.text;

        if (
          typeof name !== 'string' ||
          typeof itemValue !==
            'string'
        ) {
          return [];
        }

        return [
          {
            name,
            value: itemValue,
          },
        ];
      },
    );
  }

  return Object.entries(value)
    .filter(
      (
        entry,
      ): entry is [
        string,
        string | number,
      ] =>
        typeof entry[1] ===
          'string' ||
        typeof entry[1] ===
          'number',
    )
    .map(([name, itemValue]) => ({
      name,
      value: String(itemValue),
    }));
}

export function RealizationDetailPage() {
  const { slug = '' } = useParams();

  const [
    realization,
    setRealization,
  ] =
    useState<RealizationDetail | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    lightboxIndex,
    setLightboxIndex,
  ] = useState<number | null>(
    null,
  );

  const touchStart =
    useRef<number | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    getRealization(
      slug,
      controller.signal,
    )
      .then((data) =>
        setRealization(
          data ?? null,
        ),
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
            : 'Impossible de charger cette réalisation.',
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

  const images: ContentMedia[] =
    realization
      ? [
          ...(realization.coverMedia
            ? [
                realization.coverMedia,
              ]
            : []),
          ...realization.gallery
            .map(
              (item) => item.media,
            )
            .filter(
              (item) =>
                item.resourceType ===
                'IMAGE',
            ),
        ].filter(
          (
            item,
            index,
            collection,
          ) =>
            collection.findIndex(
              (candidate) =>
                candidate.id ===
                item.id,
            ) === index,
        )
      : [];

  const technicalItems =
    normalizeTechnicalAttributes(
      realization
        ?.technicalAttributes,
    );

  function moveLightbox(
    direction: -1 | 1,
  ) {
    if (
      lightboxIndex === null ||
      images.length === 0
    ) {
      return;
    }

    setLightboxIndex(
      (
        lightboxIndex +
        direction +
        images.length
      ) % images.length,
    );
  }

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    function handleKey(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      }

      if (
        event.key ===
        'ArrowLeft'
      ) {
        moveLightbox(-1);
      }

      if (
        event.key ===
        'ArrowRight'
      ) {
        moveLightbox(1);
      }
    }

    window.addEventListener(
      'keydown',
      handleKey,
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleKey,
      );
  });

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        {isLoading ? (
          <div className="mx-auto min-h-[520px] max-w-[1360px] px-4 py-16 sm:px-6">
            <div className="h-96 animate-pulse rounded-2xl bg-goi-surface" />
          </div>
        ) : error ||
          !realization ? (
          <div className="mx-auto min-h-[520px] max-w-[1360px] px-4 py-16 sm:px-6">
            <div className="rounded-2xl bg-red-50 p-8 text-goi-danger">
              {error ??
                'Cette réalisation est introuvable.'}
            </div>
          </div>
        ) : (
          <>
            <section className="bg-goi-navy py-12 text-white">
              <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                <Link
                  to="/realisations"
                  className="inline-flex items-center gap-2 text-sm font-bold text-goi-gold"
                >
                  <ArrowLeft
                    size={16}
                  />
                  Nos Réalisations
                </Link>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-goi-gold">
                  {
                    realization
                      .category.name
                  }
                </p>

                <h1 className="mt-2 max-w-4xl text-4xl font-extrabold sm:text-5xl">
                  {
                    realization.title
                  }
                </h1>

                {(realization.location ||
                  realization.projectYear) && (
                  <div className="mt-5 flex flex-wrap gap-5 text-white/70">
                    {realization.location && (
                      <span className="flex items-center gap-2">
                        <MapPin
                          size={17}
                        />
                        {
                          realization.location
                        }
                      </span>
                    )}

                    {realization.projectYear && (
                      <span>
                        {
                          realization.projectYear
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {images.length > 0 && (
              <section className="bg-white py-12">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {images.map(
                      (image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() =>
                            setLightboxIndex(
                              index,
                            )
                          }
                          className={
                            index === 0
                              ? 'overflow-hidden rounded-2xl md:col-span-2 lg:row-span-2'
                              : 'overflow-hidden rounded-2xl'
                          }
                        >
                          <img
                            src={
                              image.secureUrl
                            }
                            alt={
                              image.alt ??
                              realization.title
                            }
                            loading={
                              index === 0
                                ? 'eager'
                                : 'lazy'
                            }
                            className="h-full min-h-60 w-full object-cover"
                          />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-goi-ivory py-14">
              <div className="mx-auto grid max-w-[1360px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.7fr]">
                <div>
                  <h2 className="text-3xl font-extrabold text-goi-navy">
                    Présentation
                  </h2>

                  <div className="mt-5 whitespace-pre-line leading-8 text-goi-muted">
                    {realization.description ??
                      realization.summary ??
                      'Aucune description détaillée publiée.'}
                  </div>
                </div>

                {technicalItems.length >
                  0 && (
                  <div className="rounded-2xl bg-white p-6">
                    <h2 className="text-xl font-bold text-goi-navy">
                      Données techniques
                    </h2>

                    <dl className="mt-5 divide-y divide-[#d8ded8]">
                      {technicalItems.map(
                        (item) => (
                          <div
                            key={`${item.name}-${item.value}`}
                            className="grid grid-cols-2 gap-4 py-3"
                          >
                            <dt className="text-sm text-goi-muted">
                              {
                                item.name
                              }
                            </dt>

                            <dd className="text-sm font-semibold text-goi-navy">
                              {
                                item.value
                              }
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </section>

            {realization.videoMedia
              ?.secureUrl && (
              <section className="bg-white py-14">
                <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
                  <h2 className="mb-6 text-3xl font-extrabold text-goi-navy">
                    Vidéo du projet
                  </h2>

                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full rounded-2xl bg-black"
                  >
                    <source
                      src={
                        realization
                          .videoMedia
                          .secureUrl
                      }
                    />
                  </video>
                </div>
              </section>
            )}

            {(realization.service ||
              realization.products
                .length > 0) && (
              <section className="bg-goi-surface py-14">
                <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                  {realization.service && (
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-goi-blue">
                        Service associé
                      </p>

                      <Link
                        to={`/services/${realization.service.slug}`}
                        className="mt-2 inline-flex text-xl font-bold text-goi-navy"
                      >
                        {
                          realization
                            .service.name
                        }
                      </Link>
                    </div>
                  )}

                  {realization.products
                    .length > 0 && (
                    <div className="mt-8">
                      <p className="text-sm font-bold uppercase tracking-wide text-goi-blue">
                        Produits associés
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {realization.products.map(
                          (product) => (
                            <Link
                              key={
                                product.id
                              }
                              to={`/produits/${product.slug}`}
                              className="rounded-xl bg-white px-5 py-3 font-semibold text-goi-navy"
                            >
                              {
                                product.name
                              }
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <SiteFooter />

      {lightboxIndex !== null &&
        images[lightboxIndex] && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Agrandissement de la réalisation"
            onTouchStart={(event) => {
              touchStart.current =
                event.touches[0]
                  ?.clientX ??
                null;
            }}
            onTouchEnd={(event) => {
              if (
                touchStart.current ===
                null
              ) {
                return;
              }

              const end =
                event
                  .changedTouches[0]
                  ?.clientX ?? 0;

              const distance =
                end -
                touchStart.current;

              touchStart.current =
                null;

              if (
                Math.abs(distance) >
                50
              ) {
                moveLightbox(
                  distance > 0
                    ? -1
                    : 1,
                );
              }
            }}
          >
            <button
              type="button"
              onClick={() =>
                setLightboxIndex(null)
              }
              className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white text-goi-navy"
              aria-label="Fermer"
            >
              <X size={22} />
            </button>

            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  moveLightbox(-1)
                }
                className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-white text-goi-navy"
                aria-label="Image précédente"
              >
                <ChevronLeft
                  size={23}
                />
              </button>
            )}

            <img
              src={
                images[lightboxIndex]
                  .secureUrl
              }
              alt={
                images[lightboxIndex]
                  .alt ??
                realization?.title ??
                'Réalisation GOI'
              }
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  moveLightbox(1)
                }
                className="absolute right-4 flex size-11 items-center justify-center rounded-full bg-white text-goi-navy"
                aria-label="Image suivante"
              >
                <ChevronRight
                  size={23}
                />
              </button>
            )}
          </div>
        )}
    </>
  );
}
