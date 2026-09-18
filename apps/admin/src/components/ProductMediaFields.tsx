import {
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
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

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
  bytes: number | null;
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

type ProductMediaFieldsProps = {
  mainMediaId: number | null;
  galleryMediaIds: number[];
  onMainMediaChange: (
    mediaId: number | null,
  ) => void;
  onGalleryMediaChange: (
    mediaIds: number[],
  ) => void;
};

type MediaScope =
  | 'brand'
  | 'home'
  | 'products'
  | 'services'
  | 'realizations'
  | 'about'
  | 'campaigns';

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

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export function ProductMediaFields({
  mainMediaId,
  galleryMediaIds,
  onMainMediaChange,
  onGalleryMediaChange,
}: ProductMediaFieldsProps) {
  const [images, setImages] =
    useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    selectedScope,
    setSelectedScope,
  ] = useState<MediaScope>(
    'products',
  );

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imageAlt, setImageAlt] =
    useState('');

  const [
    isUploadingImage,
    setIsUploadingImage,
  ] = useState(false);

  const [imageInputKey, setImageInputKey] =
    useState(0);

  const [isDragging, setIsDragging] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const loadMedia = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      const params =
        new URLSearchParams({
          status: 'READY',
          scope: selectedScope,
          resourceType: 'IMAGE',
          page: String(page),
          limit: '24',
        });

      if (search) {
        params.set('q', search);
      }

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
              'Impossible de charger les images.',
          );
        }

        setImages(
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
            : 'Impossible de charger les images.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [page, selectedScope],
  );

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  function chooseFile(
    candidate: File | null,
  ) {
    if (!candidate) {
      setImageFile(null);
      return;
    }

    if (
      !allowedImageTypes.has(
        candidate.type,
      )
    ) {
      setError(
        'Sélectionnez une image JPEG, PNG, WebP ou AVIF.',
      );
      return;
    }

    setError(null);
    setImageFile(candidate);
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

  async function uploadImage() {
    if (
      !imageFile ||
      isUploadingImage
    ) {
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    const form = new FormData();

    form.append(
      'file',
      imageFile,
      imageFile.name,
    );

    form.append(
      'scope',
      'products',
    );

    if (imageAlt.trim()) {
      form.append(
        'alt',
        imageAlt.trim(),
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
        (await response.json()) as UploadResponse;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible d’envoyer cette image.',
        );
      }

      setImageFile(null);
      setImageAlt('');

      setImageInputKey(
        (value) => value + 1,
      );

      if (
        payload.data &&
        mainMediaId === null
      ) {
        onMainMediaChange(
          payload.data.id,
        );
      }

      if (page !== 1) {
        setPage(1);
      } else {
        await loadMedia();
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’envoyer cette image.',
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  function selectMain(
    mediaId: number,
  ) {
    if (
      mainMediaId === mediaId
    ) {
      onMainMediaChange(null);
      return;
    }

    onMainMediaChange(mediaId);

    if (
      galleryMediaIds.includes(
        mediaId,
      )
    ) {
      onGalleryMediaChange(
        galleryMediaIds.filter(
          (id) => id !== mediaId,
        ),
      );
    }
  }

  function toggleGallery(
    mediaId: number,
  ) {
    if (
      mediaId === mainMediaId
    ) {
      return;
    }

    if (
      galleryMediaIds.includes(
        mediaId,
      )
    ) {
      onGalleryMediaChange(
        galleryMediaIds.filter(
          (id) => id !== mediaId,
        ),
      );

      return;
    }

    if (
      galleryMediaIds.length >= 20
    ) {
      setError(
        'La galerie est limitée à 20 images.',
      );
      return;
    }

    onGalleryMediaChange([
      ...galleryMediaIds,
      mediaId,
    ]);
  }


  return (
    <div className="md:col-span-2 space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div>
        <h4 className="font-bold text-slate-900">
          Photos du produit
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Importez une nouvelle image ou
          sélectionnez une image dans le
          dossier de votre choix.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Upload
            size={18}
            className="text-[#1F7A4D]"
          />

          <span className="text-sm font-bold text-slate-900">
            Importer une image
          </span>
        </div>

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() =>
            setIsDragging(false)
          }
          onDrop={handleDrop}
          className={[
            'mt-4 flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition',
            isDragging
              ? 'border-[#1F7A4D] bg-emerald-50'
              : 'border-slate-300 bg-slate-50',
          ].join(' ')}
        >
          <ImageIcon
            size={30}
            className="text-slate-400"
          />

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Glissez une image ici
          </p>

          <p className="mt-1 text-xs text-slate-500">
            JPEG, PNG, WebP ou AVIF
          </p>

          <input
            key={imageInputKey}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              chooseFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Choisir une image
          </button>

          {imageFile && (
            <p className="mt-3 max-w-full truncate text-xs font-semibold text-[#1F7A4D]">
              {imageFile.name}
            </p>
          )}
        </div>

        {imageFile && (
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={imageAlt}
              maxLength={255}
              onChange={(event) =>
                setImageAlt(
                  event.target.value,
                )
              }
              placeholder="Texte alternatif de l’image"
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"
            />

            <button
              type="button"
              onClick={() =>
                void uploadImage()
              }
              disabled={
                isUploadingImage
              }
              className="min-h-11 rounded-lg bg-[#0E3B2E] px-5 text-sm font-semibold text-white transition hover:bg-[#1F7A4D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingImage
                ? 'Envoi...'
                : 'Importer'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-bold text-slate-900">
              Images du dossier{' '}
              {
                mediaScopes.find(
                  (item) =>
                    item.value ===
                    selectedScope,
                )?.label
              }
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {total} image
              {total > 1 ? 's' : ''} trouvée
              {total > 1 ? 's' : ''}
              {' · '}
              {galleryMediaIds.length}/20 dans
              la galerie
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Dossier
              </span>

              <select
                value={selectedScope}
                onChange={(event) => {
                  setSelectedScope(
                    event.target.value as MediaScope,
                  );
                  setPage(1);
                }}
                className="min-h-10 min-w-52 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
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

            <button
              type="button"
              onClick={() =>
                void loadMedia()
              }
              disabled={isLoading}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white"
              aria-label="Actualiser les images"
            >
              <RefreshCw
                size={16}
                className={
                  isLoading
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>
          </div>
        </div>

        {search && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            Recherche :
            <strong className="text-slate-700">
              {search}
            </strong>

            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="font-semibold text-[#1F7A4D]"
            >
              Effacer
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chargement...
          </div>
        ) : images.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <ImageIcon
              size={30}
              className="text-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500">
              Aucune image dans ce dossier.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map(
              (item) => {
                const isMain =
                  mainMediaId ===
                  item.id;

                const isGallery =
                  galleryMediaIds.includes(
                    item.id,
                  );

                return (
                  <article
                    key={item.id}
                    className={[
                      'overflow-hidden rounded-xl border bg-white transition',
                      isMain
                        ? 'border-[#1F7A4D] ring-2 ring-emerald-100'
                        : 'border-slate-200',
                    ].join(' ')}
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={
                          item.secureUrl
                        }
                        alt={
                          item.alt ??
                          'Image produit'
                        }
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-3">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {item.alt ??
                          item.caption ??
                          item.publicId}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            selectMain(
                              item.id,
                            )
                          }
                          className={[
                            'min-h-9 rounded-lg px-2 text-xs font-semibold',
                            isMain
                              ? 'bg-[#0E3B2E] text-white'
                              : 'border border-slate-200 text-slate-700',
                          ].join(' ')}
                        >
                          {isMain
                            ? 'Principale ✓'
                            : 'Principale'}
                        </button>

                        <button
                          type="button"
                          disabled={isMain}
                          onClick={() =>
                            toggleGallery(
                              item.id,
                            )
                          }
                          className={[
                            'min-h-9 rounded-lg px-2 text-xs font-semibold',
                            isGallery
                              ? 'bg-[#F2C14E] text-slate-950'
                              : 'border border-slate-200 text-slate-700',
                            isMain
                              ? 'cursor-not-allowed opacity-40'
                              : '',
                          ].join(' ')}
                        >
                          {isGallery
                            ? 'Galerie ✓'
                            : 'Galerie'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={
                page <= 1 ||
                isLoading
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.max(
                      1,
                      value - 1,
                    ),
                )
              }
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              Précédent
            </button>

            <span className="text-sm text-slate-500">
              Page {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages ||
                isLoading
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.min(
                      totalPages,
                      value + 1,
                    ),
                )
              }
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
