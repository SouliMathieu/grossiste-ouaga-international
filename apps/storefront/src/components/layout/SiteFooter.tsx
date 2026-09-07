import {
  ArrowRight,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="bg-goi-navy text-white">
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <span className="text-3xl font-black tracking-tight">
                GOI
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Grossiste Ouaga International accompagne
              particuliers, revendeurs et entreprises dans
              leurs achats et commandes.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-300">
              <MapPin
                size={17}
                className="shrink-0 text-goi-gold"
              />
              Ouagadougou, Burkina Faso
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Catalogue
            </h3>

            <nav className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <Link
                to="/produits"
                className="hover:text-white"
              >
                Tous les produits
              </Link>

              <Link
                to="/promotions"
                className="hover:text-white"
              >
                Promotions
              </Link>

              <Link
                to="/panier"
                className="hover:text-white"
              >
                Mon panier
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              GOI
            </h3>

            <nav className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <Link
                to="/a-propos"
                className="hover:text-white"
              >
                À propos
              </Link>

              <Link
                to="/contact"
                className="hover:text-white"
              >
                Contact
              </Link>

              <span>Vente en gros</span>
              <span>Demandes de devis</span>
            </nav>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <ShieldCheck
              size={23}
              className="text-goi-gold"
            />

            <h3 className="mt-4 font-bold">
              Besoin d’un accompagnement ?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Utilisez notre page de contact pour une demande
              produit, une commande importante ou un devis.
            </p>

            <Link
              to="/contact"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-goi-gold hover:text-white"
            >
              Contacter GOI
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Grossiste Ouaga
            International.
          </p>

          <p>
            Site de catalogue et commande en ligne.
          </p>
        </div>
      </div>
    </footer>
  );
}
