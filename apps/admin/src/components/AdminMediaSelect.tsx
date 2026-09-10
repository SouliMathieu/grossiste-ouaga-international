import {
  FileVideo,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type MediaType = 'IMAGE' | 'VIDEO';

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

type ApiResponse<T> = {
  data?: T;
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
};

export function AdminMediaSelect({
  label,
  value,
  type,
  onChange,
  optional = true,
}: Props) {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
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
              'Impossible de charger les médias.',
          );
        }

        setMedia(
          (payload.data ?? []).filter(
            (item) =>
              item.resourceType === type,
          ),
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
    [type],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () =>
      media.find(
        (item) => item.id === value,
      ) ?? null,
    [media, value],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800">
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-slate-400">
              (optionnel)
            </span>
          ) : null}
        </label>

        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
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

      <select
        value={value ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
              ? Number(
                  event.target.value,
                )
              : null,
          )
        }
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">
          Aucun média
        </option>

        {media.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.alt ??
              item.caption ??
              item.publicId}
          </option>
        ))}
      </select>

      {selected && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {type === 'IMAGE' ? (
            <img
              src={selected.secureUrl}
              alt={
                selected.alt ??
                label
              }
              className="h-36 w-full object-cover"
            />
          ) : (
            <div className="flex min-h-28 items-center gap-3 p-4">
              <FileVideo className="text-blue-600" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {selected.alt ??
                    selected.publicId}
                </p>

                <a
                  href={
                    selected.secureUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-blue-600"
                >
                  Ouvrir la vidéo
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {!selected &&
        !isLoading &&
        media.length === 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            <ImageIcon size={18} />

            Aucun média compatible.
          </div>
        )}

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <Link
        to="/medias"
        className="mt-2 inline-block text-xs font-semibold text-blue-600"
      >
        Gérer la bibliothèque média
      </Link>
    </div>
  );
}
