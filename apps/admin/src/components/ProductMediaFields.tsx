import {
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type MediaAsset = {
  id: number;
  publicId: string;
  secureUrl: string;
  resourceType: 'IMAGE' | 'VIDEO' | 'RAW';
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  status: 'READY' | 'ARCHIVED';
};

type ApiResponse<T> = {
  data?: T;
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

export function ProductMediaFields({
  mainMediaId,
  galleryMediaIds,
  onMainMediaChange,
  onGalleryMediaChange,
}: ProductMediaFieldsProps) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [alt, setAlt] =
    useState('');

  const [isUploading, setIsUploading] =
    useState(false);

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
          `${API_BASE_URL}/api/admin/media?status=READY`,
        );

        const payload =
          (await response.json()) as ApiResponse<
            MediaAsset[]
          >;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger les images.',
          );
        }

        setMedia(
          (payload.data ?? []).filter(
            (item) =>
              item.resourceType === 'IMAGE',
          ),
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
    [],
  );

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function handleUpload() {
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
      'products',
    );

    if (alt.trim()) {
      form.append(
        'alt',
        alt.trim(),
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

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible d’envoyer cette image.',
        );
      }

      const uploaded = payload.data;

      setFile(null);
      setAlt('');
      setFileInputKey(
        (value) => value + 1,
      );

      await loadMedia();

      if (
        uploaded &&
        mainMediaId === null
      ) {
        onMainMediaChange(
          uploaded.id,
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’envoyer cette image.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  function selectMain(
    mediaId: number,
  ) {
    if (mainMediaId === mediaId) {
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
    if (mediaId === mainMediaId) {
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
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div>
        <h4 className="font-bold text-slate-900">
          Médias du produit
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Choisissez une image principale et,
          si nécessaire, plusieurs images de
          galerie.
        </p>
      </div>

      <div
        className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="flex items-center gap-2">
          <Upload
            size={18}
            className="text-blue-600"
          />

          <span className="text-sm font-bold text-slate-900">
            Ajouter une nouvelle image
          </span>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            key={fileInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              setFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />

          <input
            value={alt}
            maxLength={255}
            onChange={(event) =>
              setAlt(
                event.target.value,
              )
            }
            placeholder="Texte alternatif"
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          />

          <button
            type="button"
            onClick={() =>
              void handleUpload()
            }
            disabled={
              !file ||
              isUploading
            }
            className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading
              ? 'Envoi...'
              : 'Ajouter'}
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          JPEG, PNG, WebP ou AVIF —
          maximum 10 Mo.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Bibliothèque
          </p>

          <p className="text-xs text-slate-500">
            {galleryMediaIds.length}/20
            image
            {galleryMediaIds.length > 1
              ? 's'
              : ''}{' '}
            dans la galerie
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadMedia()
          }
          disabled={isLoading}
          className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
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

      {isLoading ? (
        <div className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-slate-500">
          Chargement des images...
        </div>
      ) : media.length === 0 ? (
        <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <ImageIcon
            size={30}
            className="text-slate-400"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Aucune image active
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Ajoutez une image avec le
            formulaire ci-dessus.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => {
            const isMain =
              mainMediaId === item.id;

            const isGallery =
              galleryMediaIds.includes(
                item.id,
              );

            return (
              <article
                key={item.id}
                className={[
                  'overflow-hidden rounded-xl border bg-white',
                  isMain
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : isGallery
                      ? 'border-emerald-400'
                      : 'border-slate-200',
                ].join(' ')}
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={item.secureUrl}
                    alt={
                      item.alt ??
                      'Image produit'
                    }
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {item.alt ??
                      item.publicId}
                  </p>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectMain(
                          item.id,
                        )
                      }
                      className={[
                        'min-h-9 rounded-lg px-2 text-xs font-semibold transition',
                        isMain
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                      ].join(' ')}
                    >
                      {isMain
                        ? 'Image principale ✓'
                        : 'Définir principale'}
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
                        'min-h-9 rounded-lg px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
                        isGallery
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      ].join(' ')}
                    >
                      {isGallery
                        ? 'Dans la galerie ✓'
                        : 'Ajouter à la galerie'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
