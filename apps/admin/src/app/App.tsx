import { adminFetch } from '../lib/admin-fetch';
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AdminDashboardPanel } from '../components/AdminDashboardPanel';
import { AdminShell } from '../components/AdminShell';
import { CatalogAdminPanel } from '../components/CatalogAdminPanel';
import { MediaAdminPanel } from '../components/MediaAdminPanel';
import { OrdersAdminPanel } from '../components/OrdersAdminPanel';
import { PaymentAccountsAdminPanel } from '../components/PaymentAccountsAdminPanel';
import { PaymentsAdminPanel } from '../components/PaymentsAdminPanel';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type Admin = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

export function App() {
  const [admin, setAdmin] =
    useState<Admin | null>(null);

  const [
    isCheckingSession,
    setIsCheckingSession,
  ] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');

  const [loginError, setLoginError] =
    useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await adminFetch(
          `${API_BASE_URL}/api/admin/auth/me`,
          {
            credentials: 'include',
          },
        );

        if (!response.ok) {
          setAdmin(null);
          return;
        }

        const payload =
          (await response.json()) as ApiResponse<Admin>;

        if (payload.data) {
          setAdmin(payload.data);
        }
      } catch {
        setAdmin(null);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void checkSession();
  }, []);

  const handleUnauthorized = useCallback(() => {
    setAdmin(null);
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/auth/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const payload =
        (await response.json()) as ApiResponse<Admin>;

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.message ??
            'Impossible de vous connecter.',
        );
      }

      setAdmin(payload.data);
      setPassword('');
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await adminFetch(
        `${API_BASE_URL}/api/admin/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
    } finally {
      setAdmin(null);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
            GOI
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-300">
            Vérification de la session...
          </p>
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(37,99,235,0.28),transparent_34%)]" />

          <div className="relative">
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black">
              GOI
            </div>

            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
              Administration
            </p>
          </div>

          <div className="relative max-w-xl">
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Pilotez les opérations GOI depuis un espace unique.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Commandes, paiements, catalogue et
              comptes marchands réunis dans un
              back-office sécurisé.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-slate-400">
            <ShieldCheck
              size={18}
              className="text-emerald-400"
            />
            Accès réservé aux administrateurs autorisés.
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-5 py-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
                GOI
              </div>

              <p className="mt-3 text-sm font-semibold text-blue-600">
                Administration
              </p>
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-blue-600 lg:mt-0">
              Connexion sécurisée
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Bienvenue
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              Connectez-vous pour accéder au
              back-office Grossiste Ouaga
              International.
            </p>

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Email
                </span>

                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  disabled={isLoggingIn}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Mot de passe
                </span>

                <div className="relative mt-2">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    disabled={isLoggingIn}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  />
                </div>
              </label>

              {loginError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn
                  ? 'Connexion...'
                  : 'Se connecter'}

                {!isLoggingIn && (
                  <ArrowRight size={18} />
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <AdminShell
        admin={admin}
        onLogout={() => void handleLogout()}
      >
        <Routes>
          <Route
            path="/"
            element={
              <AdminDashboardPanel
                onUnauthorized={
                  handleUnauthorized
                }
              />
            }
          />

          <Route
            path="/paiements"
            element={
              <PaymentsAdminPanel
                onUnauthorized={
                  handleUnauthorized
                }
              />
            }
          />

          <Route
            path="/commandes"
            element={<OrdersAdminPanel />}
          />

          <Route
            path="/catalogue"
            element={<CatalogAdminPanel />}
          />

          <Route
            path="/comptes-paiement"
            element={
              <PaymentAccountsAdminPanel />
            }
          />

          <Route
            path="/medias"
            element={
              <MediaAdminPanel
                onUnauthorized={
                  handleUnauthorized
                }
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AdminShell>
    </BrowserRouter>
  );
}
