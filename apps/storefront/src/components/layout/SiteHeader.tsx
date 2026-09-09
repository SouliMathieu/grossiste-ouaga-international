import {
  Menu,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
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
  const [query, setQuery] = useState('');

  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/produits') {
      return;
    }

    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') ?? '');
  }, [location.pathname, location.search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    navigate(
      value
        ? `/produits?q=${encodeURIComponent(value)}`
        : '/produits',
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center gap-5 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="Grossiste Ouaga International"
        >
          <span className="text-2xl font-black tracking-tight text-goi-navy">
            GOI
          </span>

          <span className="hidden border-l border-slate-200 pl-3 text-[11px] font-semibold uppercase leading-4 tracking-wide text-goi-muted xl:block">
            Grossiste Ouaga
            <br />
            International
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 transition',
                  isActive
                    ? 'bg-goi-surface text-goi-blue'
                    : 'text-goi-slate hover:bg-goi-surface hover:text-goi-blue',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={handleSearch}
          className="ml-auto hidden max-w-[410px] flex-1 md:block"
        >
          <label className="relative block">
            <span className="sr-only">
              Rechercher dans le catalogue
            </span>

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-goi-muted"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-goi-surface pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-goi-blue focus:bg-white focus:ring-2 focus:ring-goi-blue/10"
            />
          </label>
        </form>

        <Link
          to="/panier"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl text-goi-navy transition hover:bg-goi-surface"
          aria-label={`Voir le panier, ${totalItems} article${totalItems > 1 ? 's' : ''}`}
        >
          <ShoppingCart size={21} />

          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-goi-blue px-1 text-[11px] font-bold text-white">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-goi-navy transition hover:bg-goi-surface lg:hidden"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 md:hidden">
        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-[1360px]"
        >
          <label className="relative block">
            <span className="sr-only">
              Rechercher dans le catalogue
            </span>

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-goi-muted"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-goi-surface pl-11 pr-4 text-sm outline-none focus:border-goi-blue focus:bg-white focus:ring-2 focus:ring-goi-blue/10"
            />
          </label>
        </form>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-[1360px] flex-col">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  [
                    'flex min-h-12 items-center rounded-lg px-3 font-semibold transition',
                    isActive
                      ? 'bg-goi-surface text-goi-blue'
                      : 'text-goi-slate hover:bg-goi-surface',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
