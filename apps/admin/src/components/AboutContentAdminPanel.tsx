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
  implantationMediaId: number | null;
  missionTitle: string | null;
  missionText: string | null;
  missionMediaId: number | null;
  valuesTitle: string | null;
  values: unknown;
  valuesMediaId: number | null;
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
  implantationMediaId: number | null;
  missionTitle: string;
  missionText: string;
  missionMediaId: number | null;
  valuesTitle: string;
  values: Item[];
  valuesMediaId: number | null;
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
  implantationMediaId: null,
  missionTitle: '',
  missionText: '',
  missionMediaId: null,
  valuesTitle: '',
  values: [],
  valuesMediaId: null,
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
          implantationMediaId:
            value.implantationMediaId,
          missionTitle:
            value.missionTitle ?? '',
          missionText:
            value.missionText ?? '',
          missionMediaId:
            value.missionMediaId,
          valuesTitle:
            value.valuesTitle ?? '',
          values: items(value.values),
          valuesMediaId:
            value.valuesMediaId,
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
            implantationMediaId:
              form.implantationMediaId,
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
            valuesMediaId:
              form.valuesMediaId,
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

  const inputClass =
    'mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

  const textareaClass =
    'mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

  const sectionClass =
    'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';

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

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <h2 className="text-xl font-extrabold text-slate-900">
          Page À propos
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Gérez chaque bloc de la page avec son texte et son média associé.
          Les sections sont affichées dans le même ordre sur le site public.
        </p>
      </div>

      {/* 1. HERO */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 1
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Hero
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Première zone visible en haut de la page À propos.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">
              Titre principal
            </span>

            <input
              value={form.heroTitle}
              onChange={(event) =>
                update(
                  'heroTitle',
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Texte principal
            </span>

            <textarea
              rows={5}
              value={form.heroText}
              onChange={(event) =>
                update(
                  'heroText',
                  event.target.value,
                )
              }
              className={textareaClass}
            />
          </label>

          <AdminMediaSelect
            label="Vidéo du hero"
            type="VIDEO"
            value={form.heroVideoMediaId}
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
            value={form.heroPosterMediaId}
            onChange={(value) =>
              update(
                'heroPosterMediaId',
                value,
              )
            }
          />
        </div>
      </section>

      {/* 2. PRESENTATION */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 2
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Présentation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Présentation générale de Grossiste Ouaga International.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Titre introduction
            </span>

            <input
              value={form.introTitle}
              onChange={(event) =>
                update(
                  'introTitle',
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Introduction
            </span>

            <textarea
              rows={6}
              value={form.introText}
              onChange={(event) =>
                update(
                  'introText',
                  event.target.value,
                )
              }
              className={textareaClass}
            />
          </label>

          <div className="md:col-span-2">
            <AdminMediaSelect
              label="Image introduction"
              type="IMAGE"
              value={form.introMediaId}
              onChange={(value) =>
                update(
                  'introMediaId',
                  value,
                )
              }
            />
          </div>
        </div>
      </section>

      {/* 3. IMPLANTATION */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 3
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Implantation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Présentez la localisation de GOI et associez l’image ou la carte correspondante.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Titre implantation
            </span>

            <input
              value={form.implantationTitle}
              onChange={(event) =>
                update(
                  'implantationTitle',
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Texte implantation
            </span>

            <textarea
              rows={5}
              value={form.implantationText}
              onChange={(event) =>
                update(
                  'implantationText',
                  event.target.value,
                )
              }
              className={textareaClass}
            />
          </label>

          <div className="md:col-span-2">
            <AdminMediaSelect
              label="Image implantation / carte"
              type="IMAGE"
              value={
                form.implantationMediaId
              }
              onChange={(value) =>
                update(
                  'implantationMediaId',
                  value,
                )
              }
            />
          </div>
        </div>
      </section>

      {/* 4. MISSION */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 4
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Mission
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Expliquez la mission et le rôle de GOI auprès de ses clients.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Titre mission
            </span>

            <input
              value={form.missionTitle}
              onChange={(event) =>
                update(
                  'missionTitle',
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Texte mission
            </span>

            <textarea
              rows={6}
              value={form.missionText}
              onChange={(event) =>
                update(
                  'missionText',
                  event.target.value,
                )
              }
              className={textareaClass}
            />
          </label>

          <div className="md:col-span-2">
            <AdminMediaSelect
              label="Image mission"
              type="IMAGE"
              value={form.missionMediaId}
              onChange={(value) =>
                update(
                  'missionMediaId',
                  value,
                )
              }
            />
          </div>
        </div>
      </section>

      {/* 5. VALEURS */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 5
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Valeurs
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ajoutez les valeurs de l’entreprise avec un titre et une courte description.
          </p>
        </div>

        <div className="mt-5 space-y-5">
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
              className={inputClass}
            />
          </label>

          <ItemsEditor
            title="Valeurs"
            value={form.values}
            onChange={(value) =>
              update('values', value)
            }
          />

          <AdminMediaSelect
            label="Image des valeurs"
            type="IMAGE"
            value={form.valuesMediaId}
            onChange={(value) =>
              update(
                'valuesMediaId',
                value,
              )
            }
          />
        </div>
      </section>

      {/* 6. ATOUTS */}
      <section className={sectionClass}>
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Section 6
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            Atouts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Présentez les principaux avantages et points forts de GOI.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <label>
            <span className="text-sm font-semibold">
              Titre des atouts
            </span>

            <input
              value={form.strengthsTitle}
              onChange={(event) =>
                update(
                  'strengthsTitle',
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <ItemsEditor
            title="Atouts"
            value={form.strengths}
            onChange={(value) =>
              update(
                'strengths',
                value,
              )
            }
          />

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

      <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />

          {isSaving
            ? 'Enregistrement...'
            : 'Enregistrer À propos'}
        </button>
      </div>
    </form>
  );
}
