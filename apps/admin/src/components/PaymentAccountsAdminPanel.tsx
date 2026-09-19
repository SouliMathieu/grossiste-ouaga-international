import { adminFetch } from '../lib/admin-fetch';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type Account = {
  id: number;
  accountName: string | null;
  accountNumber: string | null;
  merchantCode: string | null;
  actionUrl: string | null;
  ussdTemplate: string | null;
  active: boolean;
};

type Method = {
  id: number;
  code: string;
  name: string;
  type: string;
  actionMode: 'MANUAL' | 'USSD' | 'URL';
  instructions: string | null;
  account: Account | null;
};

type FormState = {
  accountName: string;
  accountNumber: string;
  merchantCode: string;
  actionMode: 'MANUAL' | 'USSD' | 'URL';
  actionUrl: string;
  ussdTemplate: string;
  instructions: string;
  active: boolean;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

function toForm(method: Method): FormState {
  return {
    accountName:
      method.account?.accountName ?? '',
    accountNumber:
      method.account?.accountNumber ?? '',
    merchantCode:
      method.account?.merchantCode ?? '',
    actionMode:
      method.actionMode ?? 'MANUAL',
    actionUrl:
      method.account?.actionUrl ?? '',
    ussdTemplate:
      method.account?.ussdTemplate ?? '',
    instructions:
      method.instructions ?? '',
    active:
      method.account?.active ?? true,
  };
}

export function PaymentAccountsAdminPanel() {
  const [methods, setMethods] = useState<Method[]>(
    [],
  );

  const [forms, setForms] = useState<
    Record<string, FormState>
  >({});

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [savingCode, setSavingCode] =
    useState<string | null>(null);

  async function loadMethods() {
    setError(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/payment-accounts`,
        {
          credentials: 'include',
        },
      );

      const payload =
        (await response.json()) as
          ApiResponse<Method[]>;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de charger les moyens de paiement.',
        );
      }

      const mobileMethods = (
        payload.data ?? []
      ).filter(
        (method) =>
          method.type === 'MOBILE_MONEY',
      );

      setMethods(mobileMethods);

      setForms(
        Object.fromEntries(
          mobileMethods.map((method) => [
            method.code,
            toForm(method),
          ]),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    }
  }

  useEffect(() => {
    void loadMethods();
  }, []);

  function updateField(
    code: string,
    field: keyof FormState,
    value: string | boolean,
  ) {
    setForms((current) => ({
      ...current,
      [code]: {
        ...(current[code] ?? {
          accountName: '',
          accountNumber: '',
          merchantCode: '',
          actionMode: 'MANUAL',
          actionUrl: '',
          ussdTemplate: '',
          instructions: '',
          active: true,
        }),
        [field]: value,
      },
    }));
  }

  async function saveMethod(
    event: FormEvent,
    method: Method,
  ) {
    event.preventDefault();

    const form = forms[method.code];

    if (!form) {
      return;
    }

    setSavingCode(method.code);
    setError(null);
    setSuccess(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/payment-accounts/${encodeURIComponent(
          method.code,
        )}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountName:
              form.accountName.trim() || null,
            accountNumber:
              form.accountNumber.trim() || null,
            merchantCode:
              form.merchantCode.trim() || null,
            actionMode:
              form.actionMode,
            actionUrl:
              form.actionMode === 'URL'
                ? form.actionUrl.trim() || null
                : null,
            ussdTemplate:
              form.actionMode === 'USSD'
                ? form.ussdTemplate.trim() || null
                : null,
            instructions:
              form.instructions.trim() || null,
            active: form.active,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          ApiResponse<unknown> | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible d’enregistrer ce compte.',
        );
      }

      setSuccess(
        `${method.name} enregistré.`,
      );

      await loadMethods();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Comptes Mobile Money
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Coordonnées affichées aux clients lors du paiement.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {methods.map((method) => {
          const form = forms[method.code];

          if (!form) {
            return null;
          }

          const looksLikeTest =
            /DEV|TEST|NON-PAYABLE/i.test(
              `${form.accountName} ${form.accountNumber} ${form.merchantCode}`,
            );

          return (
            <form
              key={method.code}
              onSubmit={(event) =>
                void saveMethod(
                  event,
                  method,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-slate-900">
                  {method.name}
                </h3>

                {looksLikeTest && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    TEST
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold">
                    Bénéficiaire
                  </span>

                  <input
                    value={form.accountName}
                    onChange={(event) =>
                      updateField(
                        method.code,
                        'accountName',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Numéro / compte de réception
                  </span>

                  <input
                    value={form.accountNumber}
                    onChange={(event) =>
                      updateField(
                        method.code,
                        'accountNumber',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Code marchand (optionnel)
                  </span>

                  <input
                    value={form.merchantCode}
                    onChange={(event) =>
                      updateField(
                        method.code,
                        'merchantCode',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Instructions client
                  </span>

                  <textarea
                    rows={3}
                    value={form.instructions}
                    onChange={(event) =>
                      updateField(
                        method.code,
                        'instructions',
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                  />
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block">
                    <span className="text-sm font-semibold">
                      Action de paiement
                    </span>

                    <select
                      value={form.actionMode}
                      onChange={(event) =>
                        updateField(
                          method.code,
                          'actionMode',
                          event.target.value,
                        )
                      }
                      className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3"
                    >
                      <option value="MANUAL">
                        Manuel
                      </option>

                      <option value="USSD">
                        USSD
                      </option>

                      <option value="URL">
                        Lien / application
                      </option>
                    </select>
                  </label>

                  {form.actionMode === 'USSD' && (
                    <label className="mt-4 block">
                      <span className="text-sm font-semibold">
                        Code USSD officiel
                      </span>

                      <input
                        value={form.ussdTemplate}
                        onChange={(event) =>
                          updateField(
                            method.code,
                            'ussdTemplate',
                            event.target.value,
                          )
                        }
                        placeholder="Code officiel fourni par l’opérateur"
                        required
                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono"
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Exemple de modèle :
                        <code className="ml-1 font-mono">
                          *XXX*...*XXXXXXXX*{'{amount}'}#
                        </code>
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Utilisez uniquement un code USSD
                        officiel et testé. Vous pouvez
                        utiliser {'{amount}'} pour insérer
                        automatiquement le montant de la
                        commande.
                      </p>
                    </label>
                  )}

                  {form.actionMode === 'URL' && (
                    <label className="mt-4 block">
                      <span className="text-sm font-semibold">
                        Lien officiel
                      </span>

                      <input
                        type="url"
                        value={form.actionUrl}
                        onChange={(event) =>
                          updateField(
                            method.code,
                            'actionUrl',
                            event.target.value,
                          )
                        }
                        placeholder="https://..."
                        required
                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3"
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Utilisez uniquement un lien ou
                        deep link officiel testé avec
                        l’opérateur.
                      </p>
                    </label>
                  )}

                  {form.actionMode === 'MANUAL' && (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Aucun bouton opérateur ne sera
                      affiché. Le client utilisera les
                      informations de paiement et les
                      boutons de copie.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateField(
                        method.code,
                        'active',
                        event.target.checked,
                      )
                    }
                    className="size-5"
                  />

                  <span className="font-semibold">
                    Compte actif
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  savingCode === method.code
                }
                className="mt-5 min-h-11 rounded-lg bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingCode === method.code
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
