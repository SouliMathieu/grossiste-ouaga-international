import {
  ChevronDown,
  Menu,
  MessageCircle,
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
import { useCompany } from '../../context/CompanyContext';
import {
  getWhatsAppUrl,
} from '../../lib/content';
import {
  getCategories,
  type CatalogCategory,
} from '../../lib/catalog';

const navigation = [
  {
    label: 'Accueil',
    href: '/',
  },
  {
    label: 'Services',
    href: '/services',
  },
  {
    label: 'Nos Réalisations',
    href: '/realisations',
  },
  {
    label: 'À propos',
    href: '/a-propos',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [query, setQuery] =
    useState('');

  const [categories, setCategories] =
    useState<CatalogCategory[]>([]);

  const { totalItems } = useCart();
  const { company } = useCompany();

  const navigate = useNavigate();
  const location = useLocation();

  const whatsappUrl =
    getWhatsAppUrl(company?.whatsapp);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/produits') {
      return;
    }

    const params =
      new URLSearchParams(
        location.search,
      );

    setQuery(
      params.get('q') ?? '',
    );
  }, [
    location.pathname,
    location.search,
  ]);

  useEffect(() => {
    const controller =
      new AbortController();

    getCategories(controller.signal)
      .then((data) =>
        setCategories(data.slice(0, 8)),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
        }
      });

    return () => controller.abort();
  }, []);

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const value = query.trim();

    navigate(
      value
        ? `/produits?q=${encodeURIComponent(
            value,
          )}`
        : '/produits',
    );
  }

  const logo = (
    <>
      {company?.logoMedia?.secureUrl ? (
        <img
          src={company.logoMedia.secureUrl}
          alt={
            company.logoMedia.alt ??
            company.businessName
          }
          className="h-10 w-auto max-w-[150px] object-contain sm:h-11"
        />
      ) : (
        <span className="text-2xl font-black tracking-tight text-goi-navy">
          GOI
        </span>
      )}

      <span className="hidden border-l border-slate-200 pl-3 text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-goi-muted xl:block">
        Énergie solaire
        <br />
        & équipements
      </span>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8ded8] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-[1360px] items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label={
            company?.businessName ??
            'Grossiste Ouaga International'
          }
          className="flex shrink-0 items-center gap-3"
        >
          {logo}
        </Link>

        <nav className="hidden items-center gap-0.5 text-sm font-semibold lg:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                'rounded-lg px-3 py-2 transition',
                isActive
                  ? 'bg-goi-surface text-goi-blue'
                  : 'text-goi-slate hover:bg-goi-surface hover:text-goi-blue',
              ].join(' ')
            }
          >
            Accueil
          </NavLink>

          <div className="group relative">
            <NavLink
              to="/produits"
              className={({ isActive }) =>
                [
                  'flex items-center gap-1 rounded-lg px-3 py-2 transition',
                  isActive
                    ? 'bg-goi-surface text-goi-blue'
                    : 'text-goi-slate hover:bg-goi-surface hover:text-goi-blue',
                ].join(' ')
              }
            >
              Produits
              <ChevronDown size={15} />
            </NavLink>

            {categories.length > 0 && (
              <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="rounded-xl border border-[#d8ded8] bg-white p-2 shadow-xl">
                  <Link
                    to="/produits"
                    className="block rounded-lg px-3 py-2.5 font-semibold text-goi-navy hover:bg-goi-surface"
                  >
                    Tout le catalogue
                  </Link>

                  {categories.map(
                    (category) => (
                      <Link
                        key={category.id}
                        to={`/produits?category=${encodeURIComponent(
                          category.slug,
                        )}`}
                        className="block rounded-lg px-3 py-2.5 text-sm text-goi-slate hover:bg-goi-surface hover:text-goi-blue"
                      >
                        {category.name}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {navigation
            .slice(1)
            .map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
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
          className="ml-auto hidden max-w-[340px] flex-1 md:block"
        >
          <label className="relative block">
            <span className="sr-only">
              Rechercher un produit
            </span>

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-goi-muted"
            />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Rechercher..."
              className="h-11 w-full rounded-xl border border-[#d8ded8] bg-goi-surface pl-10 pr-3 text-sm outline-none transition focus:border-goi-blue focus:bg-white"
            />
          </label>
        </form>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl bg-goi-gold px-4 text-sm font-bold text-goi-navy transition hover:brightness-95 xl:flex"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}

        <Link
          to="/panier"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl text-goi-navy transition hover:bg-goi-surface"
          aria-label={`Panier : ${totalItems} article${totalItems > 1 ? 's' : ''}`}
        >
          <ShoppingCart size={21} />

          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-goi-blue px-1 text-[11px] font-bold text-white">
              {totalItems > 99
                ? '99+'
                : totalItems}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (value) => !value,
            )
          }
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-goi-navy transition hover:bg-goi-surface lg:hidden"
          aria-label={
            menuOpen
              ? 'Fermer le menu'
              : 'Ouvrir le menu'
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 md:hidden">
        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-[1360px]"
        >
          <label className="relative block">
            <span className="sr-only">
              Rechercher un produit
            </span>

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-goi-muted"
            />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Rechercher un produit..."
              className="h-11 w-full rounded-xl border border-[#d8ded8] bg-goi-surface pl-10 pr-3 text-sm"
            />
          </label>
        </form>
      </div>

      {menuOpen && (
        <nav className="border-t border-[#d8ded8] bg-white px-4 py-3 shadow-xl lg:hidden">
          <div className="mx-auto flex max-w-[1360px] flex-col">
            <NavLink
              to="/"
              end
              className="flex min-h-12 items-center rounded-lg px-3 font-semibold hover:bg-goi-surface"
            >
              Accueil
            </NavLink>

            <NavLink
              to="/produits"
              className="flex min-h-12 items-center rounded-lg px-3 font-semibold hover:bg-goi-surface"
            >
              Produits
            </NavLink>

            {categories
              .slice(0, 6)
              .map((category) => (
                <Link
                  key={category.id}
                  to={`/produits?category=${encodeURIComponent(
                    category.slug,
                  )}`}
                  className="flex min-h-10 items-center pl-7 pr-3 text-sm text-goi-muted"
                >
                  {category.name}
                </Link>
              ))}

            {navigation
              .slice(1)
              .map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className="flex min-h-12 items-center rounded-lg px-3 font-semibold hover:bg-goi-surface"
                >
                  {item.label}
                </NavLink>
              ))}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-goi-gold px-4 font-bold text-goi-navy"
              >
                <MessageCircle
                  size={18}
                />
                WhatsApp
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
