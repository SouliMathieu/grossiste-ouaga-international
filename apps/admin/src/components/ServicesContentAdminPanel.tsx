import {
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
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

type Service = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  coverMediaId: number | null;
  sortOrder: number;
  active: boolean;
};

type FormState = {
  name: string;
  shortDescription: string;
  description: string;
  coverMediaId: number | null;
  sortOrder: number;
  active: boolean;
};

const emptyForm: FormState = {
  name: '',
  shortDescription: '',
  description: '',
  coverMediaId: null,
  sortOrder: 0,
  active: true,
};

export function ServicesContentAdminPanel() {
  const [services, setServices] =
    useState<Service[]>([]);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/services`,
      );

      const payload =
        (await response.json()) as ApiResponse<
          Service[]
        >;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible de charger les services.',
        );
      }

      setServices(payload.data ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible de charger les services.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/services${
          editingId
            ? `/${editingId}`
            : ''
        }`,
        {
          method:
            editingId
              ? 'PATCH'
              : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            shortDescription:
              form.shortDescription.trim() ||
              null,
            description:
              form.description.trim() ||
              null,
            coverMediaId:
              form.coverMediaId,
            sortOrder:
              form.sortOrder,
            active: form.active,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<Service>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Enregistrement impossible.',
        );
      }

      setMessage(
        editingId
          ? 'Service modifié.'
          : 'Service créé.',
      );

      reset();
      await load();
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

  async function remove(id: number) {
    if (
      !window.confirm(
        'Supprimer ce service ?',
      )
    ) {
      return;
    }

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/services/${id}`,
        {
          method: 'DELETE',
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<unknown>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Suppression impossible.',
        );
      }

      if (editingId === id) {
        reset();
      }

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Suppression impossible.',
      );
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={save}
        className="self-start rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">
            {editingId
              ? 'Modifier le service'
              : 'Nouveau service'}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <X size={16} />
              Annuler
            </button>
          )}
        </div>

        {(error || message) && (
          <div
            className={[
              'mt-5 rounded-xl p-3 text-sm font-semibold',
              error
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700',
            ].join(' ')}
          >
            {error ?? message}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold">
              Nom *
            </span>

            <input
              required
              maxLength={191}
              value={form.name}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    name:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">
              Résumé
            </span>

            <textarea
              rows={3}
              maxLength={500}
              value={
                form.shortDescription
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    shortDescription:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">
              Description
            </span>

            <textarea
              rows={8}
              value={form.description}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <AdminMediaSelect
            label="Image de couverture"
            type="IMAGE"
            value={form.coverMediaId}
            onChange={(value) =>
              setForm(
                (current) => ({
                  ...current,
                  coverMediaId: value,
                }),
              )
            }
          />

          <label className="block">
            <span className="text-sm font-semibold">
              Ordre
            </span>

            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    sortOrder:
                      Number(
                        event.target.value,
                      ),
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  }),
                )
              }
            />
            Service visible sur le site
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={17} />
            {isSaving
              ? 'Enregistrement...'
              : editingId
                ? 'Enregistrer'
                : 'Créer le service'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-extrabold">
            Services
          </h2>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Chargement...
          </p>
        ) : services.length === 0 ? (
          <p className="p-6 text-slate-500">
            Aucun service.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {services.map(
              (service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">
                        {service.name}
                      </p>

                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          service.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {service.active
                          ? 'Actif'
                          : 'Masqué'}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Ordre{' '}
                      {service.sortOrder}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(
                          service.id,
                        );

                        setForm({
                          name:
                            service.name,
                          shortDescription:
                            service.shortDescription ??
                            '',
                          description:
                            service.description ??
                            '',
                          coverMediaId:
                            service.coverMediaId,
                          sortOrder:
                            service.sortOrder,
                          active:
                            service.active,
                        });
                      }}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void remove(
                          service.id,
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
