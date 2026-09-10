import {
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  X,
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
  resourceType:
    | 'IMAGE'
    | 'VIDEO'
    | 'RAW';
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  status:
    | 'READY'
    | 'ARCHIVED';
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type ProductMediaFieldsProps = {
  mainMediaId: number | null;
  galleryMediaIds: number[];
  datasheetMediaId: number | null;
  onMainMediaChange: (
    mediaId: number | null,
  ) => void;
  onGalleryMediaChange: (
    mediaIds: number[],
  ) => void;
  onDatasheetMediaChange: (
    mediaId: number | null,
  ) => void;
};

function formatBytes(
  bytes: number | null,
) {
  if (!bytes) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

export function ProductMediaFields({
  mainMediaId,
  galleryMediaIds,
  datasheetMediaId,
  onMainMediaChange,
  onGalleryMediaChange,
  onDatasheetMediaChange,
}: ProductMediaFieldsProps) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imageAlt, setImageAlt] =
    useState('');

  const [pdfFile, setPdfFile] =
    useState<File | null>(null);

  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [isUploadingPdf, setIsUploadingPdf] =
    useState(false);

  const [
    imageInputKey,
    setImageInputKey,
  ] = useState(0);

  const [
    pdfInputKey,
    setPdfInputKey,
  ] = useState(0);

  const loadMedia = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/media?status=READY`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            MediaAsset[]
          >;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger la bibliothèque.',
          );
        }

        setMedia(
          payload.data ?? [],
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger la bibliothèque.',
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

  const images = media.filter(
    (item) =>
      item.resourceType === 'IMAGE',
  );

  const documents = media.filter(
    (item) =>
      item.resourceType === 'RAW' &&
      item.format?.toLowerCase() ===
        'pdf',
  );

  const selectedDatasheet =
    documents.find(
      (item) =>
        item.id ===
        datasheetMediaId,
    ) ?? null;

  async function uploadImage() {
    if (
      !imageFile ||
      isUploadingImage
    ) {
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    const form =
      new FormData();

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
        (await response.json()) as ApiResponse<MediaAsset>;

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

      await loadMedia();

      if (
        payload.data &&
        mainMediaId === null
      ) {
        onMainMediaChange(
          payload.data.id,
        );
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

  async function uploadPdf() {
    if (
      !pdfFile ||
      isUploadingPdf
    ) {
      return;
    }

    setIsUploadingPdf(true);
    setError(null);

    const form =
      new FormData();

    form.append(
      'file',
      pdfFile,
      pdfFile.name,
    );

    form.append(
      'scope',
      'products',
    );

    form.append(
      'alt',
      pdfFile.name,
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
        (await response.json()) as ApiResponse<MediaAsset>;

      if (!response.ok) {
        throw new Error(
          payload.message ??
            'Impossible d’envoyer ce PDF.',
        );
      }

      setPdfFile(null);
      setPdfInputKey(
        (value) => value + 1,
      );

      if (payload.data) {
        onDatasheetMediaChange(
          payload.data.id,
        );
      }

      await loadMedia();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’envoyer ce PDF.',
      );
    } finally {
      setIsUploadingPdf(false);
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
    <div className="md:col-span-2 space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div>
        <h4 className="font-bold text-slate-900">
          Photos et fiche technique
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Choisissez l’image principale,
          les images de galerie et,
          si disponible, un PDF.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Upload
            size={18}
            className="text-blue-600"
          />

          <span className="text-sm font-bold">
            Ajouter une image
          </span>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            key={imageInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              setImageFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          <input
            value={imageAlt}
            maxLength={255}
            onChange={(event) =>
              setImageAlt(
                event.target.value,
              )
            }
            placeholder="Texte alternatif"
            className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"
          />

          <button
            type="button"
            onClick={() =>
              void uploadImage()
            }
            disabled={
              !imageFile ||
              isUploadingImage
            }
            className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isUploadingImage
              ? 'Envoi...'
              : 'Ajouter'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">
            Bibliothèque images
          </p>

          <p className="text-xs text-slate-500">
            {galleryMediaIds.length}/20
            {' '}dans la galerie
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadMedia()
          }
          disabled={isLoading}
          className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white"
          aria-label="Actualiser les médias"
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
        <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
          Chargement...
        </div>
      ) : images.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <ImageIcon
            size={30}
            className="text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-500">
            Aucune image active.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((item) => {
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
                  <p className="truncate text-xs font-semibold">
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
                        'min-h-9 rounded-lg px-2 text-xs font-semibold',
                        isMain
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700',
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
                        'min-h-9 rounded-lg px-2 text-xs font-semibold disabled:opacity-40',
                        isGallery
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700',
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

      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <FileText
            size={19}
            className="text-slate-700"
          />

          <h5 className="font-bold text-slate-900">
            Fiche technique PDF
          </h5>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            key={pdfInputKey}
            type="file"
            accept="application/pdf"
            onChange={(event) =>
              setPdfFile(
                event.target.files?.[0] ??
                  null,
              )
            }
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() =>
              void uploadPdf()
            }
            disabled={
              !pdfFile ||
              isUploadingPdf
            }
            className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isUploadingPdf
              ? 'Envoi...'
              : 'Importer le PDF'}
          </button>
        </div>

        {selectedDatasheet && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {selectedDatasheet.alt ??
                  selectedDatasheet.publicId}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PDF
                {formatBytes(
                  selectedDatasheet.bytes,
                )
                  ? ` • ${formatBytes(
                      selectedDatasheet.bytes,
                    )}`
                  : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onDatasheetMediaChange(
                  null,
                )
              }
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600"
              aria-label="Détacher le PDF"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {documents.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              PDF disponibles
            </p>

            <div className="flex flex-wrap gap-2">
              {documents.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onDatasheetMediaChange(
                        item.id,
                      )
                    }
                    className={[
                      'rounded-lg border px-3 py-2 text-sm font-semibold',
                      item.id ===
                      datasheetMediaId
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700',
                    ].join(' ')}
                  >
                    {item.alt ??
                      `PDF #${item.id}`}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          PDF uniquement — maximum 15 Mo.
        </p>
      </div>
    </div>
  );
}
