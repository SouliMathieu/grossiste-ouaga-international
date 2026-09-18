import {
  Archive,
  ArrowLeft,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type MediaStatus =
  | 'READY'
  | 'ARCHIVED';

type MediaResourceType =
  | 'IMAGE'
  | 'VIDEO'
  | 'RAW';

type MediaCategory = {
  id: number;
  name: string;
  slug: string;
};

type MediaAsset = {
  id: number;
  publicId: string;
  secureUrl: string;
  resourceType: MediaResourceType;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  categoryId: number | null;
  category?: MediaCategory | null;
  status: MediaStatus;
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
};

type MediaScope =
  | 'brand'
  | 'home'
  | 'products'
  | 'services'
  | 'realizations'
  | 'about'
  | 'campaigns';

type CategoryFilter =
  | 'ALL'
  | 'uncategorized'
  | string;

type MediaAdminPanelProps = {
  onUnauthorized?: () => void;
};

const mediaScopes: Array<{
  value: MediaScope;
  label: string;
  description: string;
}> = [
  {
    value: 'products',
    label: 'Produits',
    description:
      'Photos et médias du catalogue produits.',
  },
  {
    value: 'services',
    label: 'Services',
    description:
      'Illustrations utilisées pour les services.',
  },
  {
    value: 'realizations',
    label: 'Réalisations',
    description:
      'Photos et vidéos des réalisations.',
  },
  {
    value: 'home',
    label: 'Accueil',
    description:
      'Visuels destinés à la page d’accueil.',
  },
  {
    value: 'about',
    label: 'À propos',
    description:
      'Médias de présentation de l’entreprise.',
  },
  {
    value: 'brand',
    label: 'Identité / marque',
    description:
      'Logo, favicon et éléments de marque.',
  },
  {
    value: 'campaigns',
    label: 'Campagnes',
    description:
      'Visuels publicitaires et campagnes.',
  },
];

function formatBytes(
  value: number | null,
) {
  if (!value) {
    return '—';
  }

  if (value < 1024) {
    return `${value} o`;
  }

  if (value < 1024 * 1024) {
    return `${(
      value / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

function getMediaTypeLabel(
  type: MediaResourceType,
) {
  switch (type) {
    case 'IMAGE':
      return 'Image';

    case 'VIDEO':
      return 'Vidéo';

    case 'RAW':
      return 'Document';
  }
}

function MediaPreview({
  media,
}: {
  media: MediaAsset;
}) {
  if (
    media.resourceType === 'IMAGE'
  ) {
    return (
      <img
        src={media.secureUrl}
        alt={media.alt ?? 'Média GOI'}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (
    media.resourceType === 'VIDEO'
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950">
        <Video
          size={40}
          className="text-slate-300"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-500">
      <FileText size={42} />

      <span className="mt-2 text-xs font-semibold uppercase">
        {media.format ??
          'Document'}
      </span>
    </div>
  );
}

export function MediaAdminPanel({
  onUnauthorized,
}: MediaAdminPanelProps) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<MediaCategory[]>([]);

  const [
    selectedScope,
    setSelectedScope,
  ] = useState<MediaScope | null>(
    null,
  );

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<CategoryFilter>(
    'ALL',
  );

  const [
    uploadCategoryId,
    setUploadCategoryId,
  ] = useState('');

  const [status, setStatus] =
    useState<MediaStatus>('READY');

  const [page, setPage] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [total, setTotal] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [alt, setAlt] =
    useState('');

  const [caption, setCaption] =
    useState('');

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    actionMediaId,
    setActionMediaId,
  ] = useState<number | null>(
    null,
  );

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const activeScope =
    mediaScopes.find(
      (item) =>
        item.value ===
        selectedScope,
    ) ?? null;

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);

      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/media/categories`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            MediaCategory[]
          >;

        if (response.status === 401) {
          onUnauthorized?.();
          return;
        }

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger les catégories.',
          );
        }

        setCategories(
          payload.data ?? [],
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les catégories.',
        );
      } finally {
        setIsLoadingCategories(false);
      }
    }

    void loadCategories();
  }, [onUnauthorized]);

  const loadMedia = useCallback(
    async () => {
      if (!selectedScope) {
        setMedia([]);
        setTotal(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const params =
        new URLSearchParams({
          status,
          scope: selectedScope,
          page: String(page),
          limit: '24',
        });

      if (
        selectedScope ===
          'products' &&
        categoryFilter !== 'ALL'
      ) {
        params.set(
          'categoryId',
          categoryFilter,
        );
      }

      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/media?${params.toString()}`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            MediaAsset[]
          >;

        if (response.status === 401) {
          onUnauthorized?.();
          return;
        }

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger la bibliothèque média.',
          );
        }

        setMedia(
          payload.data ?? [],
        );

        setTotal(
          payload.meta?.total ??
            (payload.data ?? []).length,
        );

        setTotalPages(
          payload.meta?.totalPages ??
            1,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Une erreur inattendue est survenue.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      categoryFilter,
      onUnauthorized,
      page,
      selectedScope,
      status,
    ],
  );

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  function openFolder(
    scope: MediaScope,
  ) {
    setSelectedScope(scope);
    setCategoryFilter('ALL');
    setUploadCategoryId('');
    setStatus('READY');
    setPage(1);
    setError(null);
  }

  function closeFolder() {
    setSelectedScope(null);
    setCategoryFilter('ALL');
    setUploadCategoryId('');
    setMedia([]);
    setPage(1);
    setTotal(0);
    setTotalPages(1);
    setError(null);
  }

  function chooseFile(
    candidate: File | null,
  ) {
    setFile(candidate);
    setError(null);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setIsDragging(false);

    chooseFile(
      event.dataTransfer.files?.[0] ??
        null,
    );
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !file ||
      !selectedScope ||
      isUploading
    ) {
      return;
    }

    if (
      selectedScope ===
        'products' &&
      !uploadCategoryId
    ) {
      setError(
        'Choisissez la catégorie du produit avant de lancer l’import.',
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    const form = new FormData();

    form.append(
      'file',
      file,
      file.name,
    );

    form.append(
      'scope',
      selectedScope,
    );

    if (
      selectedScope ===
        'products'
    ) {
      form.append(
        'categoryId',
        uploadCategoryId,
      );
    }

    if (alt.trim()) {
      form.append(
        'alt',
        alt.trim(),
      );
    }

    if (caption.trim()) {
      form.append(
        'caption',
        caption.trim(),
      );
    }

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/media/upload`,
          {
            method: 'POST',
            body: form,
          },
        );

      const payload =
        (await response.json()) as ApiResponse<
          MediaAsset
        >;

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible d’envoyer ce média.',
        );
      }

      setFile(null);
      setAlt('');
      setCaption('');

      setFileInputKey(
        (value) => value + 1,
      );

      if (status !== 'READY') {
        setStatus('READY');
        setPage(1);
        return;
      }

      if (page !== 1) {
        setPage(1);
        return;
      }

      await loadMedia();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function updateStatus(
    mediaId: number,
    action:
      | 'archive'
      | 'restore',
  ) {
    if (
      actionMediaId !== null
    ) {
      return;
    }

    setActionMediaId(mediaId);
    setError(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/media/${mediaId}/${action}`,
          {
            method: 'PATCH',
          },
        );

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok) {
        const payload =
          (await response.json().catch(
            () => null,
          )) as ApiResponse<never> | null;

        throw new Error(
          payload?.message ??
            'Impossible de modifier ce média.',
        );
      }

      await loadMedia();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setActionMediaId(null);
    }
  }

  async function updateCategory(
    mediaId: number,
    categoryId: number | null,
  ) {
    if (
      actionMediaId !== null
    ) {
      return;
    }

    setActionMediaId(mediaId);
    setError(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/media/${mediaId}/category`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              categoryId,
            }),
          },
        );

      const payload =
        (await response
          .json()
          .catch(
            () => null,
          )) as ApiResponse<MediaAsset> | null;

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible de modifier la catégorie du média.',
        );
      }

      await loadMedia();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible de modifier la catégorie du média.',
      );
    } finally {
      setActionMediaId(null);
    }
  }

  async function deleteMedia(
    item: MediaAsset,
  ) {
    if (
      actionMediaId !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Supprimer définitivement « ${
          item.alt ??
          item.publicId
        } » ?\n\nCette opération supprimera aussi le fichier dans Cloudinary.`,
      );

    if (!confirmed) {
      return;
    }

    setActionMediaId(item.id);
    setError(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/media/${item.id}`,
          {
            method: 'DELETE',
          },
        );

      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok) {
        const payload =
          (await response.json().catch(
            () => null,
          )) as ApiResponse<never> | null;

        throw new Error(
          payload?.message ??
            'Impossible de supprimer ce média.',
        );
      }

      await loadMedia();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setActionMediaId(null);
    }
  }

  if (!selectedScope) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Bibliothèque médias
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choisissez d’abord le dossier
            dans lequel vous souhaitez
            travailler.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mediaScopes.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  openFolder(
                    item.value,
                  )
                }
                className="group min-h-40 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1F7A4D] hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-[#1F7A4D] transition group-hover:bg-[#0E3B2E] group-hover:text-white">
                  <FolderOpen
                    size={22}
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-950">
                  {item.label}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </button>
            ),
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={closeFolder}
            className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#1F7A4D]"
          >
            <ArrowLeft size={16} />
            Tous les dossiers
          </button>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {activeScope?.label}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {activeScope?.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setStatus('READY');
                setPage(1);
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                status === 'READY'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              Actifs
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus(
                  'ARCHIVED',
                );
                setPage(1);
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                status === 'ARCHIVED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              Archivés
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadMedia()
            }
            disabled={isLoading}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Actualiser"
          >
            <RefreshCw
              size={17}
              className={
                isLoading
                  ? 'animate-spin'
                  : ''
              }
            />
          </button>
        </div>
      </div>

      {selectedScope ===
        'products' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block max-w-md">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Catégorie affichée
            </span>

            <select
              value={categoryFilter}
              disabled={
                isLoadingCategories
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setCategoryFilter(
                  value,
                );

                setPage(1);

                if (
                  value !==
                    'ALL' &&
                  value !==
                    'uncategorized'
                ) {
                  setUploadCategoryId(
                    value,
                  );
                }
              }}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value="ALL">
                Toutes les catégories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.name}
                  </option>
                ),
              )}

              <option value="uncategorized">
                Sans catégorie
              </option>
            </select>
          </label>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleUpload}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1F7A4D]">
              <Upload size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-950">
                Ajouter un média
              </h3>

              <p className="text-sm text-slate-500">
                Destination :{' '}
                <strong>
                  {activeScope?.label}
                </strong>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {selectedScope ===
              'products' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Catégorie produit *
                </span>

                <select
                  value={
                    uploadCategoryId
                  }
                  required
                  disabled={
                    isLoadingCategories
                  }
                  onChange={(event) =>
                    setUploadCategoryId(
                      event.target
                        .value,
                    )
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">
                    Choisir une catégorie
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    ),
                  )}
                </select>

                <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                  Obligatoire pour
                  classer correctement
                  les médias produits.
                </span>
              </label>
            )}

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Fichier
              </span>

              <div
                onDragEnter={(
                  event,
                ) => {
                  event.preventDefault();
                  setIsDragging(
                    true,
                  );
                }}
                onDragOver={(
                  event,
                ) => {
                  event.preventDefault();
                  setIsDragging(
                    true,
                  );
                }}
                onDragLeave={() =>
                  setIsDragging(
                    false,
                  )
                }
                onDrop={handleDrop}
                className={[
                  'flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition',
                  isDragging
                    ? 'border-[#1F7A4D] bg-emerald-50'
                    : 'border-slate-300 bg-slate-50',
                ].join(' ')}
              >
                <Upload
                  size={28}
                  className="text-slate-400"
                />

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Glissez votre fichier ici
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Images, vidéos ou PDF
                </p>

                <input
                  key={fileInputKey}
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime,application/pdf"
                  onChange={(event) =>
                    chooseFile(
                      event.target
                        .files?.[0] ??
                        null,
                    )
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef
                      .current
                      ?.click()
                  }
                  className="mt-4 min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Choisir un fichier
                </button>

                {file && (
                  <p className="mt-3 max-w-full truncate text-xs font-semibold text-[#1F7A4D]">
                    {file.name}
                  </p>
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Texte alternatif
              </span>

              <input
                type="text"
                value={alt}
                maxLength={255}
                onChange={(event) =>
                  setAlt(
                    event.target.value,
                  )
                }
                placeholder="Ex. Panneau solaire 200 W"
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-[#1F7A4D] focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Légende
              </span>

              <textarea
                value={caption}
                maxLength={500}
                rows={3}
                onChange={(event) =>
                  setCaption(
                    event.target.value,
                  )
                }
                placeholder="Description facultative"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F7A4D] focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Images : JPEG, PNG,
              WebP ou AVIF — 10 Mo max.
              <br />
              Vidéos : MP4, WebM ou
              MOV — 50 Mo max.
              <br />
              Documents : PDF — 15 Mo
              max.
            </div>

            <button
              type="submit"
              disabled={
                !file ||
                isUploading ||
                (selectedScope ===
                  'products' &&
                  !uploadCategoryId)
              }
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E3B2E] px-4 text-sm font-semibold text-white transition hover:bg-[#1F7A4D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={17} />

              {isUploading
                ? 'Envoi en cours...'
                : 'Importer le média'}
            </button>
          </div>
        </form>

        <div className="min-w-0">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Médias
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {total} média
              {total > 1
                ? 's'
                : ''}
              {' '}dans ce classement
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
              Chargement de la bibliothèque...
            </div>
          ) : media.length ===
            0 ? (
            <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ImageIcon
                  size={25}
                />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Aucun média
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Aucun média ne correspond
                actuellement à ce dossier
                et à ce classement.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {media.map(
                  (item) => {
                    const isWorking =
                      actionMediaId ===
                      item.id;

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <a
                          href={
                            item.secureUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-[4/3] overflow-hidden bg-slate-100"
                        >
                          <MediaPreview
                            media={item}
                          />
                        </a>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {item.alt ??
                                  item.publicId}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {
                                  activeScope?.label
                                }
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                              {getMediaTypeLabel(
                                item.resourceType,
                              )}
                            </span>
                          </div>

                          {selectedScope ===
                            'products' && (
                            <label className="mt-3 block">
                              <span className="mb-1 block text-xs font-semibold text-slate-600">
                                Catégorie
                              </span>

                              <select
                                value={
                                  item.category?.id
                                    ? String(
                                        item.category.id,
                                      )
                                    : ''
                                }
                                disabled={
                                  isWorking
                                }
                                onChange={(event) =>
                                  void updateCategory(
                                    item.id,
                                    event.target
                                      .value
                                      ? Number(
                                          event
                                            .target
                                            .value,
                                        )
                                      : null,
                                  )
                                }
                                className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
                              >
                                <option value="">
                                  Sans catégorie
                                </option>

                                {categories.map(
                                  (
                                    category,
                                  ) => (
                                    <option
                                      key={
                                        category.id
                                      }
                                      value={
                                        category.id
                                      }
                                    >
                                      {
                                        category.name
                                      }
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                          )}

                          {item.caption && (
                            <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
                              {
                                item.caption
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              {item.format?.toUpperCase() ??
                                '—'}
                            </span>

                            <span>
                              {formatBytes(
                                item.bytes,
                              )}
                            </span>

                            {item.width &&
                              item.height && (
                                <span>
                                  {
                                    item.width
                                  }{' '}
                                  ×{' '}
                                  {
                                    item.height
                                  }
                                </span>
                              )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            {item.status ===
                            'READY' ? (
                              <button
                                type="button"
                                disabled={
                                  isWorking
                                }
                                onClick={() =>
                                  void updateStatus(
                                    item.id,
                                    'archive',
                                  )
                                }
                                className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                <Archive
                                  size={
                                    15
                                  }
                                />
                                Archiver
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    isWorking
                                  }
                                  onClick={() =>
                                    void updateStatus(
                                      item.id,
                                      'restore',
                                    )
                                  }
                                  className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <RotateCcw
                                    size={
                                      15
                                    }
                                  />
                                  Restaurer
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isWorking
                                  }
                                  onClick={() =>
                                    void deleteMedia(
                                      item,
                                    )
                                  }
                                  className="flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2
                                    size={
                                      15
                                    }
                                  />
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                  <button
                    type="button"
                    disabled={
                      page <= 1 ||
                      isLoading
                    }
                    onClick={() =>
                      setPage(
                        (
                          value,
                        ) =>
                          Math.max(
                            1,
                            value -
                              1,
                          ),
                      )
                    }
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Précédent
                  </button>

                  <span className="text-sm text-slate-500">
                    Page {page} /{' '}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >=
                        totalPages ||
                      isLoading
                    }
                    onClick={() =>
                      setPage(
                        (
                          value,
                        ) =>
                          Math.min(
                            totalPages,
                            value +
                              1,
                          ),
                      )
                    }
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
