import { ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function B2BSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="grid gap-8 rounded-goi-lg border border-slate-200 bg-goi-navy p-8 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-goi-md bg-white/10 text-goi-gold">
              <Building2 size={24} />
            </div>

            <p className="mt-6 font-semibold text-goi-gold">
              Revendeurs & entreprises
            </p>

            <h2 className="mt-2 max-w-2xl text-3xl font-extrabold">
              Besoin de quantités importantes ou d’un tarif adapté ?
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Préparez votre demande de devis en ligne avec les produits et
              quantités souhaités. GOI pourra ensuite traiter votre demande de
              manière structurée.
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
          >
            Demander un devis
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
