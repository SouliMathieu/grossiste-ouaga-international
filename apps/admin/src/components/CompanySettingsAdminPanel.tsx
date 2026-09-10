import {
  Building2,
  Save,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';
import { AdminMediaSelect } from './AdminMediaSelect';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Company = {
  businessName: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hoursText: string | null;
  mapsUrl: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  logoMediaId: number | null;
  faviconMediaId: number | null;
};

type FormState = {
  businessName: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  hoursText: string;
  mapsUrl: string;
  latitude: string;
  longitude: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  logoMediaId: number | null;
  faviconMediaId: number | null;
};

const emptyForm: FormState = {
  businessName:
    'Grossiste Ouaga International',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  hoursText: '',
  mapsUrl: '',
  latitude: '',
  longitude: '',
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  logoMediaId: null,
  faviconMediaId: null,
};

function nullable(
  value: string,
) {
  return value.trim() || null;
}

export function CompanySettingsAdminPanel() {
  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/content/company`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            Company | null
          >;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger les paramètres.',
          );
        }

        if (payload.data) {
          const value =
            payload.data;

          setForm({
            businessName:
              value.businessName,
            address:
              value.address ?? '',
            city:
              value.city ?? '',
            phone:
              value.phone ?? '',
            whatsapp:
              value.whatsapp ?? '',
            email:
              value.email ?? '',
            hoursText:
              value.hoursText ?? '',
            mapsUrl:
              value.mapsUrl ?? '',
            latitude:
              value.latitude ===
                null
                ? ''
                : String(
                    value.latitude,
                  ),
            longitude:
              value.longitude ===
                null
                ? ''
                : String(
                    value.longitude,
                  ),
            facebookUrl:
              value.facebookUrl ??
              '',
            instagramUrl:
              value.instagramUrl ??
              '',
            linkedinUrl:
              value.linkedinUrl ??
              '',
            youtubeUrl:
              value.youtubeUrl ?? '',
            tiktokUrl:
              value.tiktokUrl ?? '',
            logoMediaId:
              value.logoMediaId,
            faviconMediaId:
              value.faviconMediaId,
          });
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les paramètres.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/content/company`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              businessName:
                form.businessName.trim(),
              address:
                nullable(form.address),
              city:
                nullable(form.city),
              phone:
                nullable(form.phone),
              whatsapp:
                nullable(
                  form.whatsapp,
                ),
              email:
                nullable(form.email),
              hoursText:
                nullable(
                  form.hoursText,
                ),
              mapsUrl:
                nullable(
                  form.mapsUrl,
                ),
              latitude:
                form.latitude.trim()
                  ? Number(
                      form.latitude,
                    )
                  : null,
              longitude:
                form.longitude.trim()
                  ? Number(
                      form.longitude,
                    )
                  : null,
              facebookUrl:
                nullable(
                  form.facebookUrl,
                ),
              instagramUrl:
                nullable(
                  form.instagramUrl,
                ),
              linkedinUrl:
                nullable(
                  form.linkedinUrl,
                ),
              youtubeUrl:
                nullable(
                  form.youtubeUrl,
                ),
              tiktokUrl:
                nullable(
                  form.tiktokUrl,
                ),
              logoMediaId:
                form.logoMediaId,
              faviconMediaId:
                form.faviconMediaId,
            }),
          },
        );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<Company>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Enregistrement impossible.',
        );
      }

      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Enregistrement impossible.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-slate-500">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {(error || success) && (
        <div
          className={[
            'rounded-xl border p-4 text-sm font-semibold',
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          ].join(' ')}
        >
          {error ??
            'Paramètres enregistrés.'}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-600" />

          <div>
            <h2 className="text-xl font-extrabold">
              Entreprise
            </h2>

            <p className="text-sm text-slate-500">
              Ces informations alimentent le site public.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Nom commercial *
            </span>

            <input
              required
              value={
                form.businessName
              }
              onChange={(event) =>
                update(
                  'businessName',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Adresse
            </span>

            <textarea
              rows={2}
              value={form.address}
              onChange={(event) =>
                update(
                  'address',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Ville
            </span>

            <input
              value={form.city}
              onChange={(event) =>
                update(
                  'city',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Téléphone
            </span>

            <input
              value={form.phone}
              onChange={(event) =>
                update(
                  'phone',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              WhatsApp
            </span>

            <input
              value={form.whatsapp}
              onChange={(event) =>
                update(
                  'whatsapp',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Email
            </span>

            <input
              type="email"
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

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Horaires
            </span>

            <textarea
              rows={3}
              value={
                form.hoursText
              }
              onChange={(event) =>
                update(
                  'hoursText',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Identité visuelle
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <AdminMediaSelect
            label="Logo"
            type="IMAGE"
            value={
              form.logoMediaId
            }
            onChange={(value) =>
              update(
                'logoMediaId',
                value,
              )
            }
          />

          <AdminMediaSelect
            label="Favicon"
            type="IMAGE"
            value={
              form.faviconMediaId
            }
            onChange={(value) =>
              update(
                'faviconMediaId',
                value,
              )
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Localisation
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Lien Google Maps
            </span>

            <input
              type="url"
              value={form.mapsUrl}
              onChange={(event) =>
                update(
                  'mapsUrl',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Latitude
            </span>

            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(event) =>
                update(
                  'latitude',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Longitude
            </span>

            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(event) =>
                update(
                  'longitude',
                  event.target.value,
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Réseaux sociaux
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {(
            [
              ['facebookUrl', 'Facebook'],
              ['instagramUrl', 'Instagram'],
              ['linkedinUrl', 'LinkedIn'],
              ['youtubeUrl', 'YouTube'],
              ['tiktokUrl', 'TikTok'],
            ] as const
          ).map(
            ([key, label]) => (
              <label key={key}>
                <span className="text-sm font-semibold">
                  {label}
                </span>

                <input
                  type="url"
                  value={form[key]}
                  onChange={(event) =>
                    update(
                      key,
                      event.target.value,
                    )
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>
            ),
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:opacity-50"
      >
        <Save size={18} />
        {isSaving
          ? 'Enregistrement...'
          : 'Enregistrer les paramètres'}
      </button>
    </form>
  );
}
