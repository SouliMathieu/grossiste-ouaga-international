import { ArrowLeft, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';

export function NotFoundPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />

      <main className="bg-goi-surface">
        <section className="mx-auto flex min-h-[62vh] max-w-[1360px] items-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <div className="flex size-14 items-center justify-center rounded-goi-lg bg-goi-blue/10 text-goi-blue">
              <PackageSearch size={27} />
            </div>

            <p className="mt-7 font-semibold text-goi-blue">
              Erreur 404
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-goi-navy sm:text-5xl">
              Cette page n’existe pas.
            </h1>

            <p className="mt-5 text-lg leading-8 text-goi-muted">
              Le lien utilisé est peut-être incorrect ou la page a
              été déplacée.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex min-h-12 items-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white"
              >
                <ArrowLeft size={18} />
                Retour à l’accueil
              </Link>

              <Link
                to="/produits"
                className="inline-flex min-h-12 items-center rounded-goi-md border border-slate-300 bg-white px-6 font-semibold text-goi-navy"
              >
                Voir le catalogue
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
