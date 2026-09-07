import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="bg-goi-navy text-white">
      <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              to="/"
              className="text-3xl font-extrabold tracking-tight"
            >
              GOI
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Grossiste Ouaga International accompagne particuliers,
              revendeurs et entreprises dans leurs achats et commandes.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Navigation</h3>

            <nav className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <Link to="/produits" className="hover:text-white">
                Produits
              </Link>

              <Link to="/promotions" className="hover:text-white">
                Promotions
              </Link>

              <Link to="/a-propos" className="hover:text-white">
                À propos
              </Link>

              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-bold">Services</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <span>Commandes en ligne</span>
              <span>Demandes de devis</span>
              <span>Vente en gros</span>
              <span>Assistance WhatsApp</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Contact</h3>

            <div className="mt-4 flex flex-col gap-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-goi-gold" />
                <span>Ouagadougou, Burkina Faso</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-goi-gold" />
                <span>+226 XX XX XX XX</span>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle
                  size={18}
                  className="shrink-0 text-goi-gold"
                />
                <span>WhatsApp GOI</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-goi-gold" />
                <span>contact@goi.example</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Grossiste Ouaga International.
          </p>

          <div className="flex gap-5">
            <Link to="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>

            <Link to="/conditions" className="hover:text-white">
              Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
