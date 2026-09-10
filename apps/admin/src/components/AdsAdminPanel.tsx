import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import { adminFetch } from '../lib/admin-fetch';
import { AdminMediaSelect } from './AdminMediaSelect';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type Platform =
  | 'META'
  | 'GOOGLE';

type IntegrationStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'STOPPED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

type Integration = {
  platform: Platform;
  status: IntegrationStatus;
  externalAccountId: string | null;
  externalBusinessId: string | null;
  externalPageId: string | null;
  externalProfileId: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  prerequisites:
    Record<string, boolean>;
};

type Product = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  status: string;
};

type Metric = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type Campaign = {
  id: number;
  platform: Platform;
  objective:
    | 'WHATSAPP'
    | 'PRODUCT_VISITS'
    | 'SALES_CONVERSIONS';
  budgetType:
    | 'DAILY'
    | 'TOTAL';
  budgetAmount: number;
  currency: string;
  startAt: string;
  endAt: string;
  audienceZone: string;
  adText: string;
  status: CampaignStatus;
  externalStatus: string | null;
  externalCampaignId: string | null;
  createdAt: string;
  product: Product;
  metrics: Metric[];
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type FormState = {
  platform: Platform;
  productId: number;
  objective:
    | 'WHATSAPP'
    | 'PRODUCT_VISITS'
    | 'SALES_CONVERSIONS';
  budgetType:
    | 'DAILY'
    | 'TOTAL';
  budgetAmount: string;
  startAt: string;
  endAt: string;
  audienceZone: string;
  adText: string;
  creativeMediaId: number | null;
  budgetConfirmed: boolean;
};

const initialForm: FormState = {
  platform: 'META',
  productId: 0,
  objective: 'WHATSAPP',
  budgetType: 'TOTAL',
  budgetAmount: '',
  startAt: '',
  endAt: '',
  audienceZone: 'Ouagadougou',
  adText: '',
  creativeMediaId: null,
  budgetConfirmed: false,
};

function formatAmount(
  value: number,
  currency = 'XOF',
) {
  return `${new Intl.NumberFormat(
    'fr-FR',
  ).format(value)} ${currency}`;
}

function platformLabel(
  platform: Platform,
) {
  return platform === 'META'
    ? 'Meta Ads'
    : 'Google Ads';
}

function integrationStatusLabel(
  status: IntegrationStatus,
) {
  switch (status) {
    case 'CONNECTED':
      return 'Connecté';
    case 'CONNECTING':
      return 'Connexion en cours';
    case 'ERROR':
      return 'Erreur';
    default:
      return 'Non connecté';
  }
}

function campaignStatusLabel(
  status: CampaignStatus,
) {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon';
    case 'PENDING_REVIEW':
      return 'En validation';
    case 'ACTIVE':
      return 'Active';
    case 'PAUSED':
      return 'En pause';
    case 'STOPPED':
      return 'Arrêtée';
    case 'COMPLETED':
      return 'Terminée';
    case 'REJECTED':
      return 'Refusée';
    case 'FAILED':
      return 'Échec';
    default:
      return status;
  }
}

function statusClasses(
  status: CampaignStatus,
) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700';
    case 'FAILED':
    case 'REJECTED':
      return 'bg-red-50 text-red-700';
    case 'PENDING_REVIEW':
      return 'bg-amber-50 text-amber-700';
    case 'PAUSED':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function AdsAdminPanel() {
  const [searchParams] =
    useSearchParams();

  const [integrations, setIntegrations] =
    useState<Integration[]>([]);

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [form, setForm] =
    useState<FormState>(
      initialForm,
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
          integrationsResponse,
          campaignsResponse,
          productsResponse,
        ] = await Promise.all([
          adminFetch(
            `${API_BASE_URL}/api/admin/ads/integrations`,
          ),
          adminFetch(
            `${API_BASE_URL}/api/admin/ads/campaigns`,
          ),
          adminFetch(
            `${API_BASE_URL}/api/admin/catalog/products`,
          ),
        ]);

        const integrationPayload =
          (await integrationsResponse.json()) as ApiResponse<
            Integration[]
          >;

        const campaignPayload =
          (await campaignsResponse.json()) as ApiResponse<
            Campaign[]
          >;

        const productPayload =
          (await productsResponse.json()) as ApiResponse<
            Product[]
          >;

        if (
          !integrationsResponse.ok ||
          !campaignsResponse.ok ||
          !productsResponse.ok
        ) {
          throw new Error(
            integrationPayload.message ??
              campaignPayload.message ??
              productPayload.message ??
              'Impossible de charger les publicités.',
          );
        }

        setIntegrations(
          integrationPayload.data ?? [],
        );

        setCampaigns(
          campaignPayload.data ?? [],
        );

        const published =
          (productPayload.data ?? [])
            .filter(
              (product) =>
                product.status ===
                'PUBLISHED',
            );

        setProducts(published);

        const requestedProductId =
          Number(
            searchParams.get(
              'productId',
            ),
          );

        setForm(
          (current) => {
            if (
              Number.isInteger(
                requestedProductId,
              ) &&
              published.some(
                (product) =>
                  product.id ===
                  requestedProductId,
              )
            ) {
              return {
                ...current,
                productId:
                  requestedProductId,
              };
            }

            if (
              current.productId ===
                0 &&
              published[0]
            ) {
              return {
                ...current,
                productId:
                  published[0].id,
              };
            }

            return current;
          },
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Impossible de charger les publicités.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const selectedIntegration =
    useMemo(
      () =>
        integrations.find(
          (integration) =>
            integration.platform ===
            form.platform,
        ) ?? null,
      [
        integrations,
        form.platform,
      ],
    );

  const isConnected =
    selectedIntegration?.status ===
    'CONNECTED';

  const configuredPrerequisites =
    selectedIntegration
      ? Object.values(
          selectedIntegration.prerequisites,
        ).filter(Boolean).length
      : 0;

  const totalPrerequisites =
    selectedIntegration
      ? Object.keys(
          selectedIntegration.prerequisites,
        ).length
      : 0;

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!isConnected) {
      setError(
        `${platformLabel(
          form.platform,
        )} doit être connecté avant la création d’une campagne.`,
      );
      return;
    }

    if (
      !form.productId ||
      !form.creativeMediaId
    ) {
      setError(
        'Sélectionnez un produit et une image publicitaire.',
      );
      return;
    }

    const budget =
      Number(form.budgetAmount);

    if (
      !Number.isInteger(budget) ||
      budget <= 0
    ) {
      setError(
        'Le budget doit être un montant entier positif.',
      );
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/ads/campaigns`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              platform:
                form.platform,
              productId:
                form.productId,
              objective:
                form.objective,
              budgetType:
                form.budgetType,
              budgetAmount:
                budget,
              startAt:
                form.startAt,
              endAt:
                form.endAt,
              audienceZone:
                form.audienceZone.trim(),
              adText:
                form.adText.trim(),
              creativeMediaId:
                form.creativeMediaId,
              budgetConfirmed:
                form.budgetConfirmed,
            }),
          },
        );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<Campaign>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible de préparer la campagne.',
        );
      }

      setSuccess(
        'Campagne préparée en brouillon.',
      );

      setForm(
        (current) => ({
          ...initialForm,
          platform:
            current.platform,
          productId:
            current.productId,
        }),
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible de préparer la campagne.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={[
            'rounded-xl border p-4 text-sm font-semibold',
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          ].join(' ')}
        >
          {error ?? success}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {(
          ['META', 'GOOGLE'] as const
        ).map((platform) => {
          const integration =
            integrations.find(
              (item) =>
                item.platform ===
                platform,
            );

          const status =
            integration?.status ??
            'NOT_CONNECTED';

          const connected =
            status === 'CONNECTED';

          return (
            <div
              key={platform}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Megaphone
                      size={21}
                    />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-slate-950">
                      {platformLabel(
                        platform,
                      )}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Publicité externe
                    </p>
                  </div>
                </div>

                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    connected
                      ? 'bg-emerald-50 text-emerald-700'
                      : status ===
                          'ERROR'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {integrationStatusLabel(
                    status,
                  )}
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Configuration serveur
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {integration
                    ? `${
                        Object.values(
                          integration.prerequisites,
                        ).filter(Boolean)
                          .length
                      }/${
                        Object.keys(
                          integration.prerequisites,
                        ).length
                      } prérequis configurés`
                    : 'Aucune configuration détectée'}
                </p>
              </div>

              {!connected && (
                <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    Aucune publicité ne sera
                    envoyée à cette plateforme
                    tant que la connexion
                    officielle n’est pas
                    configurée.
                  </p>
                </div>
              )}

              {integration?.lastError && (
                <p className="mt-4 text-sm text-red-600">
                  {
                    integration.lastError
                  }
                </p>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-slate-950">
            Préparer une publicité
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Le budget doit être confirmé
            explicitement avant toute
            création.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-5 p-5 md:grid-cols-2 sm:p-6"
        >
          <label>
            <span className="text-sm font-semibold">
              Plateforme *
            </span>

            <select
              value={form.platform}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    platform:
                      event.target
                        .value as Platform,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="META">
                Meta Ads
              </option>

              <option value="GOOGLE">
                Google Ads
              </option>
            </select>

            <p className="mt-2 text-xs text-slate-500">
              {selectedIntegration
                ? `${integrationStatusLabel(
                    selectedIntegration.status,
                  )} • ${configuredPrerequisites}/${totalPrerequisites} prérequis`
                : 'Non connecté'}
            </p>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Produit publié *
            </span>

            <select
              required
              value={
                form.productId || ''
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    productId:
                      Number(
                        event.target
                          .value,
                      ),
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="">
                Sélectionner
              </option>

              {products.map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} —{' '}
                    {product.sku}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Objectif *
            </span>

            <select
              value={form.objective}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    objective:
                      event.target
                        .value as FormState['objective'],
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="WHATSAPP">
                Conversations WhatsApp
              </option>

              <option value="PRODUCT_VISITS">
                Visites produit
              </option>

              <option value="SALES_CONVERSIONS">
                Ventes / conversions
              </option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Type de budget *
            </span>

            <select
              value={form.budgetType}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    budgetType:
                      event.target
                        .value as FormState['budgetType'],
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="TOTAL">
                Budget total
              </option>

              <option value="DAILY">
                Budget quotidien
              </option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Budget XOF *
            </span>

            <input
              required
              type="number"
              min={1}
              step={1}
              value={
                form.budgetAmount
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    budgetAmount:
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
              Zone ciblée *
            </span>

            <input
              required
              maxLength={500}
              value={
                form.audienceZone
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    audienceZone:
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
              Début *
            </span>

            <input
              required
              type="datetime-local"
              value={form.startAt}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    startAt:
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
              Fin *
            </span>

            <input
              required
              type="datetime-local"
              value={form.endAt}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    endAt:
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
              Texte publicitaire *
            </span>

            <textarea
              required
              rows={5}
              maxLength={5000}
              value={form.adText}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    adText:
                      event.target
                        .value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <div className="md:col-span-2">
            <AdminMediaSelect
              label="Image publicitaire"
              type="IMAGE"
              value={
                form.creativeMediaId
              }
              optional={false}
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    creativeMediaId:
                      value,
                  }),
                )
              }
            />
          </div>

          <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input
              required
              type="checkbox"
              className="mt-1"
              checked={
                form.budgetConfirmed
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    budgetConfirmed:
                      event.target
                        .checked,
                  }),
                )
              }
            />

            <span className="text-sm leading-6 text-amber-900">
              Je confirme le budget et les
              dates indiqués. Cette
              confirmation ne signifie pas
              qu’une dépense a déjà été
              engagée.
            </span>
          </label>

          <button
            type="submit"
            disabled={
              isSaving ||
              !isConnected
            }
            className="md:col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Megaphone size={18} />

            {isSaving
              ? 'Préparation...'
              : isConnected
                ? 'Préparer la campagne'
                : `${platformLabel(
                    form.platform,
                  )} non connecté`}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-extrabold">
              Campagnes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              État local et dernières
              métriques synchronisées.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Chargement...
          </p>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <BarChart3
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold">
              Aucune campagne
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map(
              (campaign) => {
                const metric =
                  campaign.metrics[0];

                return (
                  <div
                    key={campaign.id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-slate-950">
                            {
                              campaign
                                .product
                                .name
                            }
                          </p>

                          <span
                            className={[
                              'rounded-full px-2.5 py-1 text-xs font-semibold',
                              statusClasses(
                                campaign.status,
                              ),
                            ].join(' ')}
                          >
                            {campaignStatusLabel(
                              campaign.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {platformLabel(
                            campaign.platform,
                          )}
                          {' • '}
                          {formatAmount(
                            campaign.budgetAmount,
                            campaign.currency,
                          )}
                          {' • '}
                          {
                            campaign
                              .audienceZone
                          }
                        </p>
                      </div>

                      {campaign.externalCampaignId && (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <ExternalLink
                            size={14}
                          />
                          ID externe{' '}
                          {
                            campaign.externalCampaignId
                          }
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label:
                            'Dépenses',
                          value: metric
                            ? formatAmount(
                                metric.spend,
                                campaign.currency,
                              )
                            : '—',
                          icon:
                            CircleDollarSign,
                        },
                        {
                          label:
                            'Impressions',
                          value:
                            metric?.impressions ??
                            '—',
                          icon:
                            BarChart3,
                        },
                        {
                          label:
                            'Clics',
                          value:
                            metric?.clicks ??
                            '—',
                          icon:
                            CheckCircle2,
                        },
                        {
                          label:
                            'Conversions',
                          value:
                            metric?.conversions ??
                            '—',
                          icon:
                            CheckCircle2,
                        },
                      ].map(
                        ({
                          label,
                          value,
                          icon: Icon,
                        }) => (
                          <div
                            key={label}
                            className="rounded-xl bg-slate-50 p-4"
                          >
                            <Icon
                              size={17}
                              className="text-slate-400"
                            />

                            <p className="mt-3 text-lg font-extrabold">
                              {value}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {label}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}
