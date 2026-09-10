import {
  Boxes,
  CreditCard,
  LayoutDashboard,
  Images,
  LogOut,
  Menu,
  MessageSquareText,
  PanelsTopLeft,
  Building2,
  ReceiptText,
  Settings2,
  WalletCards,
  X,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  NavLink,
  useLocation,
} from 'react-router-dom';

type Admin = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

type AdminShellProps = {
  admin: Admin;
  onLogout: () => void;
  children: ReactNode;
};

const navigation = [
  {
    label: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Paiements',
    href: '/paiements',
    icon: CreditCard,
  },
  {
    label: 'Commandes',
    href: '/commandes',
    icon: ReceiptText,
  },
  {
    label: 'Catalogue',
    href: '/catalogue',
    icon: Boxes,
  },
  {
    label: 'Comptes paiement',
    href: '/comptes-paiement',
    icon: WalletCards,
  },
  {
    label: 'Médias',
    href: '/medias',
    icon: Images,
  },
  {
    label: 'Contenu du site',
    href: '/contenu',
    icon: PanelsTopLeft,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquareText,
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: Building2,
  },
];

const pageMeta: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  '/': {
    title: 'Tableau de bord',
    description:
      'Vue d’ensemble de l’activité Grossiste Ouaga International.',
  },
  '/paiements': {
    title: 'Paiements',
    description:
      'Vérifiez et validez les paiements clients.',
  },
  '/commandes': {
    title: 'Commandes',
    description:
      'Suivez la préparation, la livraison et le retrait.',
  },
  '/catalogue': {
    title: 'Catalogue',
    description:
      'Gérez les produits et leur disponibilité.',
  },
  '/comptes-paiement': {
    title: 'Comptes de paiement',
    description:
      'Configurez les comptes marchands utilisés par GOI.',
  },
  '/medias': {
    title: 'Bibliothèque média',
    description:
      'Ajoutez et organisez les images, vidéos et documents du site.',
  },
  '/contenu': {
    title: 'Contenu du site',
    description:
      'Gérez l’accueil, les services, les réalisations et la page À propos.',
  },
  '/messages': {
    title: 'Messages',
    description:
      'Consultez et traitez les demandes envoyées depuis le site.',
  },
  '/parametres': {
    title: 'Paramètres entreprise',
    description:
      'Gérez les coordonnées, le logo, les réseaux sociaux et la localisation.',
  },
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AdminShell({
  admin,
  onLogout,
  children,
}: AdminShellProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const meta =
    pageMeta[location.pathname] ?? pageMeta['/']!;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
          GOI
        </div>

        <div>
          <p className="font-bold text-white">
            Administration
          </p>

          <p className="text-xs text-slate-400">
            Back-office
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Navigation
        </p>

        <div className="space-y-1">
          {navigation.map(
            ({ label, href, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                end={href === '/'}
                className={({ isActive }) =>
                  [
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ),
          )}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
            {getInitials(admin.fullName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {admin.fullName}
            </p>

            <p className="truncate text-xs text-slate-400">
              {admin.role}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-slate-950 lg:flex">
        {sidebar}
      </aside>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-950 shadow-2xl lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 flex size-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
              aria-label="Fermer"
            >
              <X size={21} />
            </button>

            {sidebar}
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold text-slate-950 sm:text-2xl">
                {meta.title}
              </h1>

              <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                {meta.description}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 md:flex">
                <Settings2 size={16} />
                {admin.role}
              </div>

              <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {getInitials(admin.fullName)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
