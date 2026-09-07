import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PromoBanner() {
  return (
    <section className="bg-white pb-16 sm:pb-20">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="overflow-hidden rounded-goi-lg bg-goi-navy">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-semibold text-goi-gold">
                Offres & arrivages
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-extrabold text-white">
                Découvrez les produits mis en avant par GOI
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Les promotions et nouveautés réelles seront administrées
                directement depuis le backoffice.
              </p>
            </div>

            <Link
              to="/promotions"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-goi-md bg-goi-gold px-6 font-bold text-goi-navy transition hover:brightness-95"
            >
              Voir les offres
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
