import {
  Check,
  Image as ImageIcon,
  RefreshCw,
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
  alt: string | null;
  caption: string | null;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Props = {
  label: string;
  value: number[];
  onChange: (ids: number[]) => void;
  limit?: number;
};

export function AdminMediaMultiSelect({
  label,
  value,
  onChange,
  limit = 30,
}: Props) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(
        value.filter(
          (item) => item !== id,
        ),
      );
      return;
    }

    if (value.length >= limit) {
      setError(
        `Maximum ${limit} images.`,
      );
      return;
    }

    onChange([...value, id]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {value.length}/{limit} sélectionnée(s)
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200"
          aria-label="Actualiser les images"
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

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">
          Chargement...
        </p>
      ) : media.length === 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          <ImageIcon size={18} />
          Aucune image active.
        </div>
      ) : (
        <div className="mt-3 grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => {
            const selected =
              value.includes(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  toggle(item.id)
                }
                className={[
                  'relative overflow-hidden rounded-xl border bg-white text-left',
                  selected
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <img
                  src={item.secureUrl}
                  alt={item.alt ?? ''}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />

                {selected && (
                  <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={15} />
                  </span>
                )}

                <p className="truncate p-2 text-xs font-semibold">
                  {item.alt ??
                    item.caption ??
                    item.publicId}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
