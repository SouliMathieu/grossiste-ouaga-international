import {
  Archive,
  FileText,
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
  useState,
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
  status: MediaStatus;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

type MediaScope =
  | 'brand'
  | 'home'
  | 'products'
  | 'services'
  | 'realizations'
  | 'about'
  | 'campaigns';

type MediaAdminPanelProps = {
  onUnauthorized?: () => void;
};

const mediaScopes: Array<{
  value: MediaScope;
  label: string;
}> = [
  {
    value: 'products',
    label: 'Produits',
  },
  {
    value: 'services',
    label: 'Services',
  },
  {
    value: 'realizations',
    label: 'Réalisations',
  },
  {
    value: 'home',
    label: 'Accueil',
  },
  {
    value: 'about',
    label: 'À propos',
  },
  {
    value: 'brand',
    label: 'Identité / marque',
  },
  {
    value: 'campaigns',
    label: 'Campagnes',
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
  if (media.resourceType === 'IMAGE') {
    return (
      <img
        src={media.secureUrl}
        alt={media.alt ?? 'Média GOI'}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (media.resourceType === 'VIDEO') {
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
        {media.format ?? 'Document'}
      </span>
    </div>
  );
}

export function MediaAdminPanel({
  onUnauthorized,
}: MediaAdminPanelProps) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [status, setStatus] =
    useState<MediaStatus>('READY');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [scope, setScope] =
    useState<MediaScope>('products');

  const [alt, setAlt] =
    useState('');

  const [caption, setCaption] =
    useState('');

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    actionMediaId,
    setActionMediaId,
  ] = useState<number | null>(null);

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0);

  const loadMedia = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminFetch(
          `${API_BASE_URL}/api/admin/media?status=${status}`,
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

        setMedia(payload.data ?? []);
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
    [onUnauthorized, status],
  );

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!file || isUploading) {
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
      scope,
    );

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
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/media/upload`,
        {
          method: 'POST',
          body: form,
        },
      );

      const payload =
        (await response.json()) as ApiResponse<MediaAsset>;

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
    action: 'archive' | 'restore',
  ) {
    if (actionMediaId !== null) {
      return;
    }

    setActionMediaId(mediaId);
    setError(null);

    try {
      const response = await adminFetch(
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

  async function deleteMedia(
    item: MediaAsset,
  ) {
    if (actionMediaId !== null) {
      return;
    }

    const confirmed = window.confirm(
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
      const response = await adminFetch(
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

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Upload size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Ajouter un média
              </h2>

              <p className="text-sm text-slate-500">
                Envoyé directement vers Cloudinary.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Fichier
              </span>

              <input
                key={fileInputKey}
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime,application/pdf"
                onChange={(event) =>
                  setFile(
                    event.target.files?.[0] ??
                      null,
                  )
                }
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-semibold file:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Destination
              </span>

              <select
                value={scope}
                onChange={(event) =>
                  setScope(
                    event.target.value as MediaScope,
                  )
                }
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {mediaScopes.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </label>

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
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <span className="mt-1 block text-xs text-slate-500">
                Recommandé pour les images accessibles et le SEO.
              </span>
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
                placeholder="Description facultative du média"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Images : JPEG, PNG, WebP ou AVIF, maximum 10 Mo.
              <br />
              Vidéos : MP4, WebM ou MOV, maximum 50 Mo.
              <br />
              Documents : PDF, maximum 15 Mo.
            </div>

            <button
              type="submit"
              disabled={
                !file ||
                isUploading
              }
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={17} />

              {isUploading
                ? 'Envoi en cours...'
                : 'Envoyer le média'}
            </button>
          </div>
        </form>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Bibliothèque
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {media.length}{' '}
                média
                {media.length > 1
                  ? 's'
                  : ''}{' '}
                affiché
                {media.length > 1
                  ? 's'
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() =>
                    setStatus('READY')
                  }
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
                  onClick={() =>
                    setStatus('ARCHIVED')
                  }
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

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
              Chargement de la bibliothèque...
            </div>
          ) : media.length === 0 ? (
            <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ImageIcon size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Aucun média{' '}
                {status === 'ARCHIVED'
                  ? 'archivé'
                  : 'actif'}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {status === 'READY'
                  ? 'Ajoutez votre premier média avec le formulaire.'
                  : 'Les médias archivés apparaîtront ici.'}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {media.map((item) => {
                const isWorking =
                  actionMediaId ===
                  item.id;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <a
                      href={item.secureUrl}
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
                            {item.folder}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                          {getMediaTypeLabel(
                            item.resourceType,
                          )}
                        </span>
                      </div>

                      {item.caption && (
                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
                          {item.caption}
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
                              {item.width} ×{' '}
                              {item.height}
                            </span>
                          )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {item.status ===
                        'READY' ? (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() =>
                              void updateStatus(
                                item.id,
                                'archive',
                              )
                            }
                            className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Archive
                              size={15}
                            />
                            Archiver
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() =>
                                void updateStatus(
                                  item.id,
                                  'restore',
                                )
                              }
                              className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              <RotateCcw
                                size={15}
                              />
                              Restaurer
                            </button>

                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() =>
                                void deleteMedia(
                                  item,
                                )
                              }
                              className="flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2
                                size={15}
                              />
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
