import { MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopBar() {
  return (
    <div className="bg-goi-navy text-white">
      <div className="mx-auto flex min-h-9 max-w-[1360px] items-center justify-between gap-4 px-4 text-xs sm:px-6 sm:text-sm">
        <div className="flex items-center gap-2 text-white/75">
          <MapPin size={14} className="shrink-0 text-goi-gold" />
          <span>Ouagadougou, Burkina Faso</span>
        </div>

        <Link
          to="/contact"
          className="flex items-center gap-2 font-medium text-white/85 transition hover:text-goi-gold"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">
            Besoin d’aide ?
          </span>
          <span>Contactez-nous</span>
        </Link>
      </div>
    </div>
  );
}
