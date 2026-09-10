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

type HomeSlide = {
  id: number;
  imageMediaId: number | null;
  eyebrow: string | null;
  title: string;
  text: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  active: boolean;
  sortOrder: number;
};

type TrustCard = {
  id: number;
  title: string;
  text: string | null;
  iconKey: string | null;
  active: boolean;
  sortOrder: number;
};

type SlideForm = {
  imageMediaId: number | null;
  eyebrow: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaUrl: string;
  active: boolean;
  sortOrder: number;
};

type TrustForm = {
  title: string;
  text: string;
  iconKey: string;
  active: boolean;
  sortOrder: number;
};

const emptySlide: SlideForm = {
  imageMediaId: null,
  eyebrow: '',
  title: '',
  text: '',
  ctaLabel: '',
  ctaUrl: '',
  active: true,
  sortOrder: 0,
};

const emptyTrust: TrustForm = {
  title: '',
  text: '',
  iconKey: 'shield-check',
  active: true,
  sortOrder: 0,
};

async function request<T>(
  path: string,
  init?: RequestInit,
) {
  const response = await adminFetch(
    `${API_BASE_URL}${path}`,
    init,
  );

  const payload =
    (await response
      .json()
      .catch(() => null)) as
      | ApiResponse<T>
      | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        'Une erreur est survenue.',
    );
  }

  return payload?.data;
}

export function HomeContentAdminPanel() {
  const [slides, setSlides] =
    useState<HomeSlide[]>([]);

  const [trustCards, setTrustCards] =
    useState<TrustCard[]>([]);

  const [slideForm, setSlideForm] =
    useState<SlideForm>(emptySlide);

  const [trustForm, setTrustForm] =
    useState<TrustForm>(emptyTrust);

  const [
    editingSlideId,
    setEditingSlideId,
  ] = useState<number | null>(
    null,
  );

  const [
    editingTrustId,
    setEditingTrustId,
  ] = useState<number | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          slideData,
          trustData,
        ] = await Promise.all([
          request<HomeSlide[]>(
            '/api/admin/content/home/slides',
          ),
          request<TrustCard[]>(
            '/api/admin/content/home/trust-cards',
          ),
        ]);

        setSlides(
          slideData ?? [],
        );

        setTrustCards(
          trustData ?? [],
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger l’accueil.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function resetSlide() {
    setEditingSlideId(null);
    setSlideForm(emptySlide);
  }

  function resetTrust() {
    setEditingTrustId(null);
    setTrustForm(emptyTrust);
  }

  async function saveSlide(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const isEdit =
        editingSlideId !== null;

      await request(
        isEdit
          ? `/api/admin/content/home/slides/${editingSlideId}`
          : '/api/admin/content/home/slides',
        {
          method:
            isEdit
              ? 'PATCH'
              : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            imageMediaId:
              slideForm.imageMediaId,
            eyebrow:
              slideForm.eyebrow.trim() ||
              null,
            title:
              slideForm.title.trim(),
            text:
              slideForm.text.trim() ||
              null,
            ctaLabel:
              slideForm.ctaLabel.trim() ||
              null,
            ctaUrl:
              slideForm.ctaUrl.trim() ||
              null,
            active:
              slideForm.active,
            sortOrder:
              slideForm.sortOrder,
          }),
        },
      );

      resetSlide();

      setSuccess(
        isEdit
          ? 'Slide modifiée.'
          : 'Slide créée.',
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’enregistrer la slide.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTrust(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const isEdit =
        editingTrustId !== null;

      await request(
        isEdit
          ? `/api/admin/content/home/trust-cards/${editingTrustId}`
          : '/api/admin/content/home/trust-cards',
        {
          method:
            isEdit
              ? 'PATCH'
              : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title:
              trustForm.title.trim(),
            text:
              trustForm.text.trim() ||
              null,
            iconKey:
              trustForm.iconKey ||
              null,
            active:
              trustForm.active,
            sortOrder:
              trustForm.sortOrder,
          }),
        },
      );

      resetTrust();

      setSuccess(
        isEdit
          ? 'Carte modifiée.'
          : 'Carte créée.',
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’enregistrer la carte.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(
    path: string,
  ) {
    if (
      !window.confirm(
        'Confirmer la suppression ?',
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await request(path, {
        method: 'DELETE',
      });

      setSuccess(
        'Élément supprimé.',
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Suppression impossible.',
      );
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-slate-500">
        Chargement de l’accueil...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div
          className={[
            'rounded-xl border p-4 text-sm font-semibold',
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          ].join(' ')}
        >
          {error ?? success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-slate-950">
            Carousel d’accueil
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Maximum 4 slides actives.
          </p>
        </div>

        <form
          onSubmit={saveSlide}
          className="grid gap-5 border-b border-slate-200 bg-slate-50/60 p-5 md:grid-cols-2 sm:p-6"
        >
          <div className="md:col-span-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              {editingSlideId
                ? 'Modifier la slide'
                : 'Nouvelle slide'}
            </h3>

            {editingSlideId && (
              <button
                type="button"
                onClick={resetSlide}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500"
              >
                <X size={16} />
                Annuler
              </button>
            )}
          </div>

          <div className="md:col-span-2">
            <AdminMediaSelect
              label="Image"
              type="IMAGE"
              value={
                slideForm.imageMediaId
              }
              onChange={(value) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    imageMediaId:
                      value,
                  }),
                )
              }
            />
          </div>

          <label>
            <span className="text-sm font-semibold">
              Sur-titre
            </span>

            <input
              value={
                slideForm.eyebrow
              }
              maxLength={120}
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    eyebrow:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Titre *
            </span>

            <input
              required
              value={
                slideForm.title
              }
              maxLength={191}
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Texte
            </span>

            <textarea
              rows={3}
              value={slideForm.text}
              maxLength={500}
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    text:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Texte du bouton
            </span>

            <input
              value={
                slideForm.ctaLabel
              }
              maxLength={120}
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    ctaLabel:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Destination du bouton
            </span>

            <input
              value={
                slideForm.ctaUrl
              }
              maxLength={2000}
              placeholder="/produits"
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    ctaUrl:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Ordre
            </span>

            <input
              type="number"
              min={0}
              value={
                slideForm.sortOrder
              }
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    sortOrder:
                      Number(
                        event.target
                          .value,
                      ),
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={
                slideForm.active
              }
              onChange={(event) =>
                setSlideForm(
                  (current) => ({
                    ...current,
                    active:
                      event.target
                        .checked,
                  }),
                )
              }
            />
            Slide active
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="md:col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={17} />
            {editingSlideId
              ? 'Enregistrer'
              : 'Ajouter la slide'}
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {slides.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Aucune slide.
            </p>
          ) : (
            slides.map((slide) => (
              <div
                key={slide.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {slide.title}
                    </p>

                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        slide.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500',
                      ].join(' ')}
                    >
                      {slide.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Ordre {slide.sortOrder}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlideId(
                        slide.id,
                      );

                      setSlideForm({
                        imageMediaId:
                          slide.imageMediaId,
                        eyebrow:
                          slide.eyebrow ??
                          '',
                        title:
                          slide.title,
                        text:
                          slide.text ?? '',
                        ctaLabel:
                          slide.ctaLabel ??
                          '',
                        ctaUrl:
                          slide.ctaUrl ??
                          '',
                        active:
                          slide.active,
                        sortOrder:
                          slide.sortOrder,
                      });
                    }}
                    className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-blue-600"
                    aria-label="Modifier"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void remove(
                        `/api/admin/content/home/slides/${slide.id}`,
                      )
                    }
                    className="flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-slate-950">
            Cartes de confiance
          </h2>
        </div>

        <form
          onSubmit={saveTrust}
          className="grid gap-5 border-b border-slate-200 bg-slate-50/60 p-5 md:grid-cols-2 sm:p-6"
        >
          <label>
            <span className="text-sm font-semibold">
              Titre *
            </span>

            <input
              required
              value={
                trustForm.title
              }
              maxLength={120}
              onChange={(event) =>
                setTrustForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Icône
            </span>

            <select
              value={
                trustForm.iconKey
              }
              onChange={(event) =>
                setTrustForm(
                  (current) => ({
                    ...current,
                    iconKey:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="shield-check">
                Confiance
              </option>
              <option value="badge-check">
                Qualité
              </option>
              <option value="truck">
                Livraison
              </option>
              <option value="headphones">
                Accompagnement
              </option>
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Texte
            </span>

            <textarea
              rows={3}
              value={trustForm.text}
              maxLength={500}
              onChange={(event) =>
                setTrustForm(
                  (current) => ({
                    ...current,
                    text:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Ordre
            </span>

            <input
              type="number"
              min={0}
              value={
                trustForm.sortOrder
              }
              onChange={(event) =>
                setTrustForm(
                  (current) => ({
                    ...current,
                    sortOrder:
                      Number(
                        event.target
                          .value,
                      ),
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={
                trustForm.active
              }
              onChange={(event) =>
                setTrustForm(
                  (current) => ({
                    ...current,
                    active:
                      event.target
                        .checked,
                  }),
                )
              }
            />
            Carte active
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="md:col-span-2 min-h-11 rounded-xl bg-slate-900 px-5 font-semibold text-white"
          >
            {editingTrustId
              ? 'Enregistrer la carte'
              : 'Ajouter la carte'}
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {trustCards.map(
            (card) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {card.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Ordre {card.sortOrder}
                    {' • '}
                    {card.active
                      ? 'Active'
                      : 'Inactive'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrustId(
                        card.id,
                      );

                      setTrustForm({
                        title:
                          card.title,
                        text:
                          card.text ?? '',
                        iconKey:
                          card.iconKey ??
                          'shield-check',
                        active:
                          card.active,
                        sortOrder:
                          card.sortOrder,
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
                        `/api/admin/content/home/trust-cards/${card.id}`,
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
      </section>
    </div>
  );
}
