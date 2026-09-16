import {
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type AdminAccount = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

type FormState = {
  fullName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

const emptyForm: FormState = {
  fullName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

export function AdminAccountSettingsPanel() {
  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/auth/me`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            AdminAccount
          >;

        if (
          !response.ok ||
          !payload.data
        ) {
          throw new Error(
            payload.message ??
              'Impossible de charger le compte administrateur.',
          );
        }

        setForm({
          fullName:
            payload.data.fullName,
          email:
            payload.data.email,
          currentPassword: '',
          newPassword: '',
          newPasswordConfirm: '',
        });
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Impossible de charger le compte administrateur.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadAccount();
  }, []);

  function update(
    key: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (
      form.newPassword &&
      form.newPassword.length < 8
    ) {
      setError(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      );
      return;
    }

    if (
      form.newPassword !==
      form.newPasswordConfirm
    ) {
      setError(
        'La confirmation du nouveau mot de passe ne correspond pas.',
      );
      return;
    }

    setIsSaving(true);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/auth/account`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              fullName:
                form.fullName.trim(),
              email:
                form.email.trim(),
              currentPassword:
                form.currentPassword,
              newPassword:
                form.newPassword,
              newPasswordConfirm:
                form.newPasswordConfirm,
            }),
          },
        );

      const payload =
        (await response.json()) as ApiResponse<
          AdminAccount
        >;

      if (
        !response.ok ||
        !payload.data
      ) {
        throw new Error(
          payload.message ??
            'Impossible de mettre à jour le compte.',
        );
      }

      setForm({
        fullName:
          payload.data.fullName,
        email:
          payload.data.email,
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
      });

      setSuccess(
        payload.message ??
          'Compte administrateur mis à jour.',
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Impossible de mettre à jour le compte.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold">
              Compte administrateur
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Modifiez le nom, l’email de connexion
              ou le mot de passe utilisé pour accéder
              au backoffice.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">
              Nom complet
            </span>

            <input
              type="text"
              required
              maxLength={120}
              autoComplete="name"
              value={form.fullName}
              onChange={(event) =>
                update(
                  'fullName',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Email de connexion
            </span>

            <input
              type="email"
              required
              maxLength={191}
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                update(
                  'email',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-extrabold">
          Sécurité
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Le mot de passe actuel est obligatoire
          pour confirmer une modification du compte.
          Laissez les champs « nouveau mot de passe »
          vides si vous ne souhaitez pas le changer.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Mot de passe actuel
            </span>

            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="current-password"
              value={
                form.currentPassword
              }
              onChange={(event) =>
                update(
                  'currentPassword',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Nouveau mot de passe
            </span>

            <input
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(event) =>
                update(
                  'newPassword',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Confirmer le nouveau mot de passe
            </span>

            <input
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={
                form.newPasswordConfirm
              }
              onChange={(event) =>
                update(
                  'newPasswordConfirm',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:opacity-50"
        >
          <Save size={18} />

          {isSaving
            ? 'Mise à jour...'
            : 'Mettre à jour le compte'}
        </button>
      </section>
    </form>
  );
}
