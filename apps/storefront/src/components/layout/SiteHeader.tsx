import { useState } from 'react';
import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const navigation = [
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits' },
  { label: 'Promotions', href: '/promotions' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-[1360px] items-center gap-5 px-4 sm:px-6">
        <Link
          to="/"
          className="shrink-0 text-2xl font-extrabold tracking-tight text-goi-navy"
        >
          GOI
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-goi-slate lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="transition-colors hover:text-goi-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-md flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Rechercher</span>

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-goi-muted"
            />

            <input
              type="search"
              placeholder="Rechercher un produit, une marque..."
              className="h-11 w-full rounded-goi-md border border-slate-200 bg-goi-surface pl-11 pr-4 outline-none transition focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
            />
          </label>
        </div>

        <Link
          to="/panier"
          className="relative flex size-11 items-center justify-center rounded-goi-md hover:bg-goi-surface"
          aria-label={`Voir le panier, ${totalItems} article${totalItems > 1 ? 's' : ''}`}
        >
          <ShoppingCart size={21} />

          {totalItems > 0 && (
            <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-goi-blue px-1 text-[11px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex size-11 items-center justify-center rounded-goi-md hover:bg-goi-surface lg:hidden"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 md:hidden">
        <label className="relative mx-auto block max-w-[1360px]">
          <span className="sr-only">Rechercher</span>

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-goi-muted"
          />

          <input
            type="search"
            placeholder="Rechercher un produit..."
            className="h-11 w-full rounded-goi-md border border-slate-200 bg-goi-surface pl-11 pr-4 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
          />
        </label>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1360px] flex-col">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center border-b border-slate-100 font-semibold text-goi-slate last:border-0 hover:text-goi-blue"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
