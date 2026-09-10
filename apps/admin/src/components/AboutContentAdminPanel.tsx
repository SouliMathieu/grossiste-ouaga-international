import {
  Plus,
  Save,
  Trash2,
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

type Item = {
  title: string;
  text: string;
};

type About = {
  heroTitle: string | null;
  heroText: string | null;
  heroVideoMediaId: number | null;
  heroPosterMediaId: number | null;
  introTitle: string | null;
  introText: string | null;
  introMediaId: number | null;
  implantationTitle: string | null;
  implantationText: string | null;
  missionTitle: string | null;
  missionText: string | null;
  missionMediaId: number | null;
  valuesTitle: string | null;
  values: unknown;
  strengthsTitle: string | null;
  strengths: unknown;
  strengthsMediaId: number | null;
};

type FormState = {
  heroTitle: string;
  heroText: string;
  heroVideoMediaId: number | null;
  heroPosterMediaId: number | null;
  introTitle: string;
  introText: string;
  introMediaId: number | null;
  implantationTitle: string;
  implantationText: string;
  missionTitle: string;
  missionText: string;
  missionMediaId: number | null;
  valuesTitle: string;
  values: Item[];
  strengthsTitle: string;
  strengths: Item[];
  strengthsMediaId: number | null;
};

const emptyForm: FormState = {
  heroTitle: '',
  heroText: '',
  heroVideoMediaId: null,
  heroPosterMediaId: null,
  introTitle: '',
  introText: '',
  introMediaId: null,
  implantationTitle: '',
  implantationText: '',
  missionTitle: '',
  missionText: '',
  missionMediaId: null,
  valuesTitle: '',
  values: [],
  strengthsTitle: '',
  strengths: [],
  strengthsMediaId: null,
};

function items(value: unknown): Item[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      return [];
    }

    const record =
      item as Record<string, unknown>;

    if (
      typeof record.title !==
        'string' ||
      typeof record.text !==
        'string'
    ) {
      return [];
    }

    return [
      {
        title: record.title,
        text: record.text,
      },
    ];
  });
}

function nullable(value: string) {
  return value.trim() || null;
}

function ItemsEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Item[];
  onChange: (value: Item[]) => void;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold">
          {title}
        </p>

        <button
          type="button"
          onClick={() =>
            onChange([
              ...value,
              {
                title: '',
                text: '',
              },
            ])
          }
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} />
          Ajouter
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-xl bg-white p-3 md:grid-cols-[1fr_1.5fr_auto]"
          >
            <input
              value={item.title}
              placeholder="Titre"
              onChange={(event) =>
                onChange(
                  value.map(
                    (
                      current,
                      itemIndex,
                    ) =>
                      itemIndex ===
                      index
                        ? {
                            ...current,
                            title:
                              event
                                .target
                                .value,
                          }
                        : current,
                  ),
                )
              }
              className="min-h-10 rounded-lg border border-slate-200 px-3"
            />

            <input
              value={item.text}
              placeholder="Description"
              onChange={(event) =>
                onChange(
                  value.map(
                    (
                      current,
                      itemIndex,
                    ) =>
                      itemIndex ===
                      index
                        ? {
                            ...current,
                            text:
                              event
                                .target
                                .value,
                          }
                        : current,
                  ),
                )
              }
              className="min-h-10 rounded-lg border border-slate-200 px-3"
            />

            <button
              type="button"
              onClick={() =>
                onChange(
                  value.filter(
                    (
                      _,
                      itemIndex,
                    ) =>
                      itemIndex !==
                      index,
                  ),
                )
              }
              className="flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutContentAdminPanel() {
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
        const response = await adminFetch(
          `${API_BASE_URL}/api/admin/content/about`,
        );

        const payload =
          (await response.json()) as ApiResponse<
            About | null
          >;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger la page À propos.',
          );
        }

        const value = payload.data;

        if (!value) {
          return;
        }

        setForm({
          heroTitle:
            value.heroTitle ?? '',
          heroText:
            value.heroText ?? '',
          heroVideoMediaId:
            value.heroVideoMediaId,
          heroPosterMediaId:
            value.heroPosterMediaId,
          introTitle:
            value.introTitle ?? '',
          introText:
            value.introText ?? '',
          introMediaId:
            value.introMediaId,
          implantationTitle:
            value.implantationTitle ??
            '',
          implantationText:
            value.implantationText ??
            '',
          missionTitle:
            value.missionTitle ?? '',
          missionText:
            value.missionText ?? '',
          missionMediaId:
            value.missionMediaId,
          valuesTitle:
            value.valuesTitle ?? '',
          values: items(value.values),
          strengthsTitle:
            value.strengthsTitle ??
            '',
          strengths:
            items(value.strengths),
          strengthsMediaId:
            value.strengthsMediaId,
        });
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Chargement impossible.',
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

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/about`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            heroTitle:
              nullable(
                form.heroTitle,
              ),
            heroText:
              nullable(
                form.heroText,
              ),
            heroVideoMediaId:
              form.heroVideoMediaId,
            heroPosterMediaId:
              form.heroPosterMediaId,
            introTitle:
              nullable(
                form.introTitle,
              ),
            introText:
              nullable(
                form.introText,
              ),
            introMediaId:
              form.introMediaId,
            implantationTitle:
              nullable(
                form.implantationTitle,
              ),
            implantationText:
              nullable(
                form.implantationText,
              ),
            missionTitle:
              nullable(
                form.missionTitle,
              ),
            missionText:
              nullable(
                form.missionText,
              ),
            missionMediaId:
              form.missionMediaId,
            valuesTitle:
              nullable(
                form.valuesTitle,
              ),
            values: form.values
              .filter(
                (item) =>
                  item.title.trim() &&
                  item.text.trim(),
              )
              .map((item) => ({
                title:
                  item.title.trim(),
                text:
                  item.text.trim(),
              })),
            strengthsTitle:
              nullable(
                form.strengthsTitle,
              ),
            strengths:
              form.strengths
                .filter(
                  (item) =>
                    item.title.trim() &&
                    item.text.trim(),
                )
                .map((item) => ({
                  title:
                    item.title.trim(),
                  text:
                    item.text.trim(),
                })),
            strengthsMediaId:
              form.strengthsMediaId,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<About>
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
        Chargement...
      </div>
    );
  }

  const textFields = [
    [
      'heroTitle',
      'Titre principal',
      false,
    ],
    [
      'heroText',
      'Texte principal',
      true,
    ],
    [
      'introTitle',
      'Titre introduction',
      false,
    ],
    [
      'introText',
      'Introduction',
      true,
    ],
    [
      'implantationTitle',
      'Titre implantation',
      false,
    ],
    [
      'implantationText',
      'Texte implantation',
      true,
    ],
    [
      'missionTitle',
      'Titre mission',
      false,
    ],
    [
      'missionText',
      'Texte mission',
      true,
    ],
  ] as const;

  return (
    <form
      onSubmit={save}
      className="space-y-6"
    >
      {(error || success) && (
        <div
          className={[
            'rounded-xl p-4 text-sm font-semibold',
            error
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700',
          ].join(' ')}
        >
          {error ??
            'Contenu enregistré.'}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Contenu À propos
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {textFields.map(
            ([key, label, multiline]) => (
              <label
                key={key}
                className={
                  multiline
                    ? 'md:col-span-2'
                    : ''
                }
              >
                <span className="text-sm font-semibold">
                  {label}
                </span>

                {multiline ? (
                  <textarea
                    rows={5}
                    value={form[key]}
                    onChange={(
                      event,
                    ) =>
                      update(
                        key,
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                  />
                ) : (
                  <input
                    value={form[key]}
                    onChange={(
                      event,
                    ) =>
                      update(
                        key,
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                  />
                )}
              </label>
            ),
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Médias
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <AdminMediaSelect
            label="Vidéo du hero"
            type="VIDEO"
            value={
              form.heroVideoMediaId
            }
            onChange={(value) =>
              update(
                'heroVideoMediaId',
                value,
              )
            }
          />

          <AdminMediaSelect
            label="Poster du hero"
            type="IMAGE"
            value={
              form.heroPosterMediaId
            }
            onChange={(value) =>
              update(
                'heroPosterMediaId',
                value,
              )
            }
          />

          <AdminMediaSelect
            label="Image introduction"
            type="IMAGE"
            value={
              form.introMediaId
            }
            onChange={(value) =>
              update(
                'introMediaId',
                value,
              )
            }
          />

          <AdminMediaSelect
            label="Image mission"
            type="IMAGE"
            value={
              form.missionMediaId
            }
            onChange={(value) =>
              update(
                'missionMediaId',
                value,
              )
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <label>
          <span className="text-sm font-semibold">
            Titre des valeurs
          </span>

          <input
            value={form.valuesTitle}
            onChange={(event) =>
              update(
                'valuesTitle',
                event.target.value,
              )
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
          />
        </label>

        <div className="mt-5">
          <ItemsEditor
            title="Valeurs"
            value={form.values}
            onChange={(value) =>
              update('values', value)
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <label>
          <span className="text-sm font-semibold">
            Titre des atouts
          </span>

          <input
            value={
              form.strengthsTitle
            }
            onChange={(event) =>
              update(
                'strengthsTitle',
                event.target.value,
              )
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
          />
        </label>

        <div className="mt-5">
          <ItemsEditor
            title="Atouts"
            value={
              form.strengths
            }
            onChange={(value) =>
              update(
                'strengths',
                value,
              )
            }
          />
        </div>

        <div className="mt-5">
          <AdminMediaSelect
            label="Image des atouts"
            type="IMAGE"
            value={
              form.strengthsMediaId
            }
            onChange={(value) =>
              update(
                'strengthsMediaId',
                value,
              )
            }
          />
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
          : 'Enregistrer À propos'}
      </button>
    </form>
  );
}
