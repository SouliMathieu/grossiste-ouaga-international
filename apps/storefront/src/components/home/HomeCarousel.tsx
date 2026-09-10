import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import type {
  HomeSlide,
} from '../../lib/content';

export function HomeCarousel({
  slides,
}: {
  slides: HomeSlide[];
}) {
  const items = slides.slice(0, 4);

  const [index, setIndex] =
    useState(0);

  const [paused, setPaused] =
    useState(false);

  const [reduceMotion, setReduceMotion] =
    useState(false);

  const touchStart =
    useRef<number | null>(null);

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
    if (
      items.length <= 1 ||
      paused ||
      reduceMotion
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setIndex(
          (current) =>
            (current + 1) %
            items.length,
        );
      }, 6000);

    return () =>
      window.clearInterval(timer);
  }, [
    items.length,
    paused,
    reduceMotion,
  ]);

  if (items.length === 0) {
    return (
      <section className="bg-goi-navy text-white">
        <div className="mx-auto max-w-[1360px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <p className="font-bold uppercase tracking-[0.14em] text-goi-gold">
            Grossiste Ouaga International
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Équipements et solutions pour
            vos besoins en énergie et
            installations.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Solaire, électricité,
            électronique et électroménager,
            avec accompagnement pour les
            installations solaires et
            électriques.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/produits"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-gold px-6 font-bold text-goi-navy"
            >
              Voir les produits
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-6 font-semibold"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slide = items[index]!;

  function go(
    direction: -1 | 1,
  ) {
    setIndex(
      (current) =>
        (
          current +
          direction +
          items.length
        ) % items.length,
    );
  }

  function handleTouchEnd(
    endX: number,
  ) {
    if (touchStart.current === null) {
      return;
    }

    const distance =
      endX -
      touchStart.current;

    touchStart.current = null;

    if (Math.abs(distance) < 50) {
      return;
    }

    go(
      distance > 0
        ? -1
        : 1,
    );
  }

  const cta =
    slide.ctaLabel &&
    slide.ctaUrl;

  const externalCta =
    slide.ctaUrl?.startsWith(
      'http',
    );

  return (
    <section
      className="relative overflow-hidden bg-goi-navy text-white"
      onMouseEnter={() =>
        setPaused(true)
      }
      onMouseLeave={() =>
        setPaused(false)
      }
      onFocusCapture={() =>
        setPaused(true)
      }
      onBlurCapture={() =>
        setPaused(false)
      }
      onTouchStart={(event) => {
        touchStart.current =
          event.touches[0]?.clientX ??
          null;
      }}
      onTouchEnd={(event) =>
        handleTouchEnd(
          event.changedTouches[0]
            ?.clientX ?? 0,
        )
      }
      aria-roledescription="carousel"
      aria-label="Présentation GOI"
    >
      <div className="absolute inset-0">
        {slide.imageMedia
          ?.secureUrl && (
          <img
            key={
              slide.imageMedia.id
            }
            src={
              slide.imageMedia
                .secureUrl
            }
            alt=""
            loading={
              index === 0
                ? 'eager'
                : 'lazy'
            }
            fetchPriority={
              index === 0
                ? 'high'
                : 'auto'
            }
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-goi-navy via-goi-navy/90 to-goi-navy/35" />
      </div>

      <div className="relative mx-auto flex min-h-[500px] max-w-[1360px] items-center px-4 py-16 sm:px-6 lg:min-h-[580px]">
        <div className="max-w-3xl">
          {slide.eyebrow && (
            <p className="font-bold uppercase tracking-[0.14em] text-goi-gold">
              {slide.eyebrow}
            </p>
          )}

          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[54px]">
            {slide.title}
          </h1>

          {slide.text && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              {slide.text}
            </p>
          )}

          {cta && (
            <div className="mt-7">
              {externalCta ? (
                <a
                  href={
                    slide.ctaUrl!
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-gold px-6 font-bold text-goi-navy"
                >
                  {slide.ctaLabel}
                  <ArrowRight
                    size={18}
                  />
                </a>
              ) : (
                <Link
                  to={
                    slide.ctaUrl!
                  }
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-gold px-6 font-bold text-goi-navy"
                >
                  {slide.ctaLabel}
                  <ArrowRight
                    size={18}
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <div className="absolute bottom-6 left-4 flex gap-2 sm:left-6 lg:left-[calc((100%-1360px)/2+24px)]">
            {items.map(
              (item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setIndex(
                      itemIndex,
                    )
                  }
                  className={[
                    'h-2.5 rounded-full transition-all',
                    itemIndex ===
                    index
                      ? 'w-8 bg-goi-gold'
                      : 'w-2.5 bg-white/50',
                  ].join(' ')}
                  aria-label={`Afficher la slide ${
                    itemIndex + 1
                  }`}
                  aria-current={
                    itemIndex ===
                    index
                  }
                />
              ),
            )}
          </div>

          <div className="absolute bottom-5 right-4 flex gap-2 sm:right-6">
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-goi-navy/70"
              aria-label="Slide précédente"
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <button
              type="button"
              onClick={() => go(1)}
              className="flex size-11 items-center justify-center rounded-full bg-goi-gold text-goi-navy"
              aria-label="Slide suivante"
            >
              <ArrowRight
                size={19}
              />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
