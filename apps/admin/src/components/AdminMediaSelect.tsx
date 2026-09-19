import {
  Check,
  FileVideo,
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type MediaType = 'IMAGE' | 'VIDEO';

export type MediaScope =
  | 'brand'
  | 'home'
  | 'products'
  | 'services'
  | 'realizations'
  | 'about'
  | 'campaigns';

type MediaAsset = {
  id: number;
  publicId: string;
  secureUrl: string;
  resourceType:
    | 'IMAGE'
    | 'VIDEO'
    | 'RAW';
  alt: string | null;
  caption: string | null;
  format: string | null;
};

type MediaResponse = {
  data?: MediaAsset[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UploadResponse = {
  data?: MediaAsset;
  message?: string;
};

type Props = {
  label: string;
  value: number | null;
  type: MediaType;
  onChange: (
    value: number | null,
  ) => void;
  optional?: boolean;

  /**
   * Dossier affiché par défaut dans la
   * bibliothèque.
   */
  defaultScope: MediaScope;

  /**
   * Dossier dans lequel un upload local
   * effectué depuis ce champ sera rangé.
   */
  uploadScope: MediaScope;
};

const mediaScopes: Array<{
  value: MediaScope;
  label: string;
}> = [
  {
    value: 'home',
    label: 'Accueil',
  },
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

function getAccept(
  type: MediaType,
) {
  if (type === 'IMAGE') {
    return [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ].join(',');
  }

  return [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ].join(',');
}

function MediaPreview({
  media,
  type,
}: {
  media: MediaAsset;
  type: MediaType;
}) {
  if (type === 'IMAGE') {
    return (
      <img
        src={media.secureUrl}
        alt={
          media.alt ??
          media.caption ??
          'Média GOI'
        }
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-white">
      <FileVideo size={32} />

      <span className="mt-2 max-w-[90%] truncate text-xs text-white/70">
        {media.alt ??
          media.caption ??
          'Vidéo'}
      </span>
    </div>
  );
}

export function AdminMediaSelect({
  label,
  value,
  type,
  onChange,
  optional = true,
  defaultScope,
  uploadScope,
}: Props) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [
    selectedScope,
    setSelectedScope,
  ] = useState<MediaScope>(
    defaultScope,
  );

  const [page, setPage] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [total, setTotal] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    inputKey,
    setInputKey,
  ] = useState(0);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const load = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      const params =
        new URLSearchParams({
          status: 'READY',
          scope: selectedScope,
          resourceType: type,
          page: String(page),
          limit: '18',
        });

      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/media?${params.toString()}`,
          );

        const payload =
          (await response.json()) as MediaResponse;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger les médias.',
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
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les médias.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      page,
      refreshKey,
      selectedScope,
      type,
    ],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function selectFile(
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

    selectFile(
      event.dataTransfer.files?.[0] ??
        null,
    );
  }

  async function upload() {
    if (
      !file ||
      isUploading
    ) {
      return;
    }

    setIsUploading(true);
    setError(null);

    const form =
      new FormData();

    form.append(
      'file',
      file,
      file.name,
    );

    form.append(
      'scope',
      uploadScope,
    );

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
        (await response.json()) as UploadResponse;

      if (
        !response.ok ||
        !payload.data
      ) {
        throw new Error(
          payload.message ??
            'Impossible d’importer ce média.',
        );
      }

      const uploaded =
        payload.data;

      onChange(
        uploaded.id,
      );

      setFile(null);
      setInputKey(
        (current) =>
          current + 1,
      );

      setSelectedScope(
        uploadScope,
      );

      setPage(1);

      setRefreshKey(
        (current) =>
          current + 1,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’importer ce média.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  const selectedOnPage =
    media.find(
      (item) =>
        item.id === value,
    ) ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {label}

            {optional && (
              <span className="ml-1 font-normal text-slate-400">
                (optionnel)
              </span>
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Choisissez un média existant
            ou importez-en un nouveau.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setRefreshKey(
              (current) =>
                current + 1,
            )
          }
          disabled={isLoading}
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          aria-label="Actualiser les médias"
        >
          <RefreshCw
            size={15}
            className={
              isLoading
                ? 'animate-spin'
                : ''
            }
          />
        </button>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Dossier
        </span>

        <select
          value={
            selectedScope
          }
          onChange={(event) => {
            setSelectedScope(
              event.target
                .value as MediaScope,
            );
            setPage(1);
          }}
          className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          {mediaScopes.map(
            (scope) => (
              <option
                key={
                  scope.value
                }
                value={
                  scope.value
                }
              >
                {scope.label}
              </option>
            ),
          )}
        </select>
      </label>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-600">
            Bibliothèque
          </p>

          <span className="text-xs text-slate-400">
            {total} média
            {total > 1
              ? 's'
              : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Chargement...
          </div>
        ) : media.length ===
          0 ? (
          <div className="mt-2 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Aucun média compatible
            dans ce dossier.
          </div>
        ) : (
          <div className="mt-2 grid max-h-[440px] grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-3 lg:grid-cols-4">
            {media.map(
              (item) => {
                const isSelected =
                  value ===
                  item.id;

                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      onChange(
                        isSelected
                          ? null
                          : item.id,
                      )
                    }
                    className={[
                      'relative overflow-hidden rounded-lg border-2 bg-slate-100 text-left transition',
                      isSelected
                        ? 'border-[#1F7A4D] ring-2 ring-emerald-100'
                        : 'border-transparent hover:border-slate-300',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="aspect-[4/3]">
                      <MediaPreview
                        media={
                          item
                        }
                        type={
                          type
                        }
                      />
                    </div>

                    {isSelected && (
                      <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-[#1F7A4D] text-white shadow">
                        <Check
                          size={
                            16
                          }
                        />
                      </span>
                    )}

                    <p className="truncate bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700">
                      {item.alt ??
                        item.caption ??
                        item.publicId}
                    </p>
                  </button>
                );
              },
            )}
          </div>
        )}

        {value &&
          !selectedOnPage && (
            <p className="mt-2 text-xs text-slate-500">
              Un média est déjà
              sélectionné. Il peut se
              trouver dans un autre
              dossier ou sur une autre
              page.
            </p>
          )}

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={
                page <= 1 ||
                isLoading
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current -
                        1,
                    ),
                )
              }
              className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Précédent
            </button>

            <span className="text-xs text-slate-500">
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
                  (current) =>
                    Math.min(
                      totalPages,
                      current +
                        1,
                    ),
                )
              }
              className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-700">
          Importer depuis votre
          appareil
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Le fichier sera
          automatiquement rangé dans
          «{' '}
          {
            mediaScopes.find(
              (scope) =>
                scope.value ===
                uploadScope,
            )?.label
          }
          {' '}».
        </p>

        <div
          onDragEnter={(
            event,
          ) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(
            event,
          ) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() =>
            setIsDragging(false)
          }
          onDrop={handleDrop}
          className={[
            'mt-3 flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition',
            isDragging
              ? 'border-[#1F7A4D] bg-emerald-50'
              : 'border-slate-300 bg-slate-50',
          ].join(' ')}
        >
          {type === 'IMAGE' ? (
            <ImageIcon
              size={24}
              className="text-slate-400"
            />
          ) : (
            <FileVideo
              size={24}
              className="text-slate-400"
            />
          )}

          <p className="mt-2 text-xs text-slate-500">
            Glissez le fichier ici
          </p>

          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept={getAccept(
              type,
            )}
            onChange={(event) =>
              selectFile(
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
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Choisir un fichier
          </button>

          {file && (
            <p className="mt-2 max-w-full truncate text-xs font-semibold text-[#1F7A4D]">
              {file.name}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={
            !file ||
            isUploading
          }
          onClick={() =>
            void upload()
          }
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0E3B2E] px-4 text-sm font-semibold text-white transition hover:bg-[#1F7A4D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload size={16} />

          {isUploading
            ? 'Import en cours...'
            : 'Importer et sélectionner'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <Link
        to="/medias"
        className="mt-3 inline-block text-xs font-semibold text-[#1F7A4D]"
      >
        Gérer toute la bibliothèque
        média
      </Link>
    </div>
  );
}
