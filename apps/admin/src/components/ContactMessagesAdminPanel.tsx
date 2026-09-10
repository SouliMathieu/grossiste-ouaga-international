import {
  Archive,
  Check,
  Mail,
  MailOpen,
  Phone,
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

type MessageStatus =
  | 'UNREAD'
  | 'READ'
  | 'ARCHIVED';

type ContactMessage = {
  id: number;
  subject: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

const filters: Array<{
  value: '' | MessageStatus;
  label: string;
}> = [
  {
    value: '',
    label: 'Tous',
  },
  {
    value: 'UNREAD',
    label: 'Non lus',
  },
  {
    value: 'READ',
    label: 'Lus',
  },
  {
    value: 'ARCHIVED',
    label: 'Archivés',
  },
];

export function ContactMessagesAdminPanel() {
  const [messages, setMessages] =
    useState<ContactMessage[]>([]);

  const [filter, setFilter] =
    useState<
      '' | MessageStatus
    >('');

  const [
    selectedId,
    setSelectedId,
  ] = useState<number | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = filter
          ? `?status=${filter}`
          : '';

        const response =
          await adminFetch(
            `${API_BASE_URL}/api/admin/content/messages${query}`,
          );

        const payload =
          (await response.json()) as ApiResponse<
            ContactMessage[]
          >;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              'Impossible de charger les messages.',
          );
        }

        setMessages(
          payload.data ?? [],
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les messages.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(
    id: number,
    status: MessageStatus,
  ) {
    setError(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/content/messages/${id}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              status,
            }),
          },
        );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<ContactMessage>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Modification impossible.',
        );
      }

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Modification impossible.',
      );
    }
  }

  const selected =
    messages.find(
      (item) =>
        item.id === selectedId,
    ) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              setFilter(item.value)
            }
            className={[
              'min-h-10 rounded-full px-4 text-sm font-semibold',
              filter === item.value
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-600',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {isLoading ? (
            <p className="p-6 text-slate-500">
              Chargement...
            </p>
          ) : messages.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Aucun message dans cette vue.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(
                        item.id,
                      );

                      if (
                        item.status ===
                        'UNREAD'
                      ) {
                        void setStatus(
                          item.id,
                          'READ',
                        );
                      }
                    }}
                    className={[
                      'w-full p-5 text-left transition hover:bg-slate-50',
                      selectedId ===
                      item.id
                        ? 'bg-blue-50'
                        : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={[
                          'truncate text-sm',
                          item.status ===
                          'UNREAD'
                            ? 'font-extrabold text-slate-950'
                            : 'font-semibold text-slate-700',
                        ].join(' ')}
                      >
                        {item.name}
                      </p>

                      {item.status ===
                        'UNREAD' && (
                        <span className="size-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                      {item.subject}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {new Intl.DateTimeFormat(
                        'fr-FR',
                        {
                          dateStyle:
                            'medium',
                          timeStyle:
                            'short',
                        },
                      ).format(
                        new Date(
                          item.createdAt,
                        ),
                      )}
                    </p>
                  </button>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          {!selected ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center text-slate-400">
              <Mail size={38} />

              <p className="mt-3 font-semibold">
                Sélectionnez un message.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {selected.subject}
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                    {selected.name}
                  </h2>
                </div>

                <div className="flex gap-2">
                  {selected.status !==
                    'READ' && (
                    <button
                      type="button"
                      onClick={() =>
                        void setStatus(
                          selected.id,
                          'READ',
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-emerald-600"
                      aria-label="Marquer comme lu"
                    >
                      <Check
                        size={17}
                      />
                    </button>
                  )}

                  {selected.status !==
                    'UNREAD' && (
                    <button
                      type="button"
                      onClick={() =>
                        void setStatus(
                          selected.id,
                          'UNREAD',
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-blue-600"
                      aria-label="Marquer comme non lu"
                    >
                      <MailOpen
                        size={17}
                      />
                    </button>
                  )}

                  {selected.status !==
                    'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        void setStatus(
                          selected.id,
                          'ARCHIVED',
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                      aria-label="Archiver"
                    >
                      <Archive
                        size={17}
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                >
                  <Phone size={15} />
                  {selected.phone}
                </a>

                {selected.email && (
                  <a
                    href={`mailto:${selected.email}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                  >
                    <Mail size={15} />
                    {selected.email}
                  </a>
                )}
              </div>

              <div className="mt-7 whitespace-pre-line rounded-xl bg-slate-50 p-5 leading-7 text-slate-700">
                {selected.message}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
