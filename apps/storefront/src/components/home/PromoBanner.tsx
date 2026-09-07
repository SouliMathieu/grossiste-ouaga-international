import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PromoBanner() {
  return (
    <section className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-goi-navy p-7 text-white sm:p-9">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-goi-blue/20 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex size-11 items-center justify-center rounded-xl bg-goi-gold text-goi-navy">
                <Sparkles size={21} />
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-goi-gold">
                Offres & arrivages
              </p>

              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Retrouvez les offres commerciales publiées par GOI.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Les promotions affichées sont uniquement celles
                réellement activées et validées.
              </p>
            </div>

            <Link
              to="/promotions"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-goi-gold px-6 font-bold text-goi-navy transition hover:brightness-95"
            >
              Voir les promotions
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
