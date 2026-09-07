import {
  ArrowRight,
  BadgePercent,
  PackageSearch,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';

export function PromotionsPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-goi-navy text-white">
          <div className="mx-auto max-w-[1360px] px-4 py-16 sm:px-6 sm:py-20">
            <p className="font-semibold text-goi-gold">
              Offres & arrivages
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Promotions GOI
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Retrouvez ici les offres commerciales réellement
              activées par Grossiste Ouaga International.
            </p>
          </div>
        </section>

        <section className="bg-goi-surface py-16 sm:py-20">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="grid gap-5 lg:grid-cols-3">
              <article className="rounded-goi-lg border border-slate-200 bg-white p-6">
                <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 text-goi-blue">
                  <BadgePercent size={23} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-goi-navy">
                  Promotions vérifiées
                </h2>

                <p className="mt-2 leading-7 text-goi-muted">
                  Les remises affichées sur cette page seront
                  uniquement celles configurées et confirmées par GOI.
                </p>
              </article>

              <article className="rounded-goi-lg border border-slate-200 bg-white p-6">
                <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 text-goi-blue">
                  <Sparkles size={23} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-goi-navy">
                  Nouveaux arrivages
                </h2>

                <p className="mt-2 leading-7 text-goi-muted">
                  Les nouveautés pourront être mises en avant
                  directement depuis l’administration.
                </p>
              </article>

              <article className="rounded-goi-lg border border-slate-200 bg-white p-6">
                <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 text-goi-blue">
                  <PackageSearch size={23} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-goi-navy">
                  Catalogue complet
                </h2>

                <p className="mt-2 leading-7 text-goi-muted">
                  En attendant une offre particulière, consultez les
                  produits actuellement disponibles au catalogue.
                </p>
              </article>
            </div>

            <div className="mt-10 rounded-goi-lg border border-slate-200 bg-white p-8 sm:p-10">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full bg-goi-surface px-3 py-1 text-sm font-semibold text-goi-slate">
                  Aucune promotion active
                </span>

                <h2 className="mt-5 text-2xl font-extrabold text-goi-navy sm:text-3xl">
                  Les prochaines offres apparaîtront ici.
                </h2>

                <p className="mt-3 leading-7 text-goi-muted">
                  Nous n’affichons pas de fausse réduction ni de
                  promotion artificielle. Les offres seront publiées
                  lorsqu’elles auront été validées par GOI.
                </p>

                <Link
                  to="/produits"
                  className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
                >
                  Voir le catalogue
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
