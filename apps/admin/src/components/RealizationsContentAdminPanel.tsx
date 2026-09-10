import {
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';
import { AdminMediaMultiSelect } from './AdminMediaMultiSelect';
import { AdminMediaSelect } from './AdminMediaSelect';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

type Service = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
};

type TechnicalAttribute = {
  label: string;
  value: string;
};

type Realization = {
  id: number;
  categoryId: number;
  serviceId: number | null;
  title: string;
  location: string | null;
  projectDate: string | null;
  projectYear: number | null;
  summary: string | null;
  description: string | null;
  technicalAttributes:
    | TechnicalAttribute[]
    | null;
  coverMediaId: number | null;
  videoMediaId: number | null;
  featured: boolean;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
  gallery: Array<{
    media: {
      id: number;
    };
  }>;
  products: Array<{
    product: {
      id: number;
    };
  }>;
};

type FormState = {
  categoryId: number;
  serviceId: number | null;
  title: string;
  location: string;
  projectDate: string;
  projectYear: string;
  summary: string;
  description: string;
  technicalAttributes:
    TechnicalAttribute[];
  coverMediaId: number | null;
  videoMediaId: number | null;
  galleryMediaIds: number[];
  productIds: number[];
  featured: boolean;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
};

const emptyForm: FormState = {
  categoryId: 0,
  serviceId: null,
  title: '',
  location: '',
  projectDate: '',
  projectYear: '',
  summary: '',
  description: '',
  technicalAttributes: [],
  coverMediaId: null,
  videoMediaId: null,
  galleryMediaIds: [],
  productIds: [],
  featured: false,
  sortOrder: 0,
  status: 'DRAFT',
};

function nullable(value: string) {
  return value.trim() || null;
}

function normalizeTechnical(
  value: unknown,
): TechnicalAttribute[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      return [];
    }

    const record =
      item as Record<string, unknown>;

    if (
      typeof record.label !==
        'string' ||
      typeof record.value !==
        'string'
    ) {
      return [];
    }

    return [
      {
        label: record.label,
        value: record.value,
      },
    ];
  });
}

export function RealizationsContentAdminPanel() {
  const [
    realizations,
    setRealizations,
  ] = useState<Realization[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null,
  );

  const [
    categoryName,
    setCategoryName,
  ] = useState('');

  const [
    categoryDescription,
    setCategoryDescription,
  ] = useState('');

  const [
    categoryEditingId,
    setCategoryEditingId,
  ] = useState<number | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        categoryResponse,
        serviceResponse,
        productResponse,
        realizationResponse,
      ] = await Promise.all([
        adminFetch(
          `${API_BASE_URL}/api/admin/content/realization-categories`,
        ),
        adminFetch(
          `${API_BASE_URL}/api/admin/content/services`,
        ),
        adminFetch(
          `${API_BASE_URL}/api/admin/catalog/products`,
        ),
        adminFetch(
          `${API_BASE_URL}/api/admin/content/realizations`,
        ),
      ]);

      const categoryPayload =
        (await categoryResponse.json()) as ApiResponse<
          Category[]
        >;

      const servicePayload =
        (await serviceResponse.json()) as ApiResponse<
          Service[]
        >;

      const productPayload =
        (await productResponse.json()) as ApiResponse<
          Product[]
        >;

      const realizationPayload =
        (await realizationResponse.json()) as ApiResponse<
          Realization[]
        >;

      if (
        !categoryResponse.ok ||
        !serviceResponse.ok ||
        !productResponse.ok ||
        !realizationResponse.ok
      ) {
        throw new Error(
          categoryPayload.message ??
            servicePayload.message ??
            productPayload.message ??
            realizationPayload.message ??
            'Impossible de charger les réalisations.',
        );
      }

      setCategories(
        categoryPayload.data ?? [],
      );
      setServices(
        servicePayload.data ?? [],
      );
      setProducts(
        productPayload.data ?? [],
      );
      setRealizations(
        realizationPayload.data ?? [],
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible de charger les réalisations.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCategory(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/realization-categories${
          categoryEditingId
            ? `/${categoryEditingId}`
            : ''
        }`,
        {
          method:
            categoryEditingId
              ? 'PATCH'
              : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name:
              categoryName.trim(),
            description:
              nullable(
                categoryDescription,
              ),
            sortOrder: 0,
            active: true,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<Category>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Catégorie invalide.',
        );
      }

      setCategoryName('');
      setCategoryDescription('');
      setCategoryEditingId(null);
      setSuccess(
        'Catégorie enregistrée.',
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Enregistrement impossible.',
      );
    }
  }

  async function saveRealization(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/realizations${
          editingId
            ? `/${editingId}`
            : ''
        }`,
        {
          method:
            editingId
              ? 'PATCH'
              : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            categoryId:
              form.categoryId,
            serviceId:
              form.serviceId,
            title:
              form.title.trim(),
            location:
              nullable(form.location),
            projectDate:
              form.projectDate ||
              null,
            projectYear:
              form.projectYear
                ? Number(
                    form.projectYear,
                  )
                : null,
            summary:
              nullable(form.summary),
            description:
              nullable(
                form.description,
              ),
            technicalAttributes:
              form.technicalAttributes
                .filter(
                  (item) =>
                    item.label.trim() &&
                    item.value.trim(),
                )
                .map((item) => ({
                  label:
                    item.label.trim(),
                  value:
                    item.value.trim(),
                })),
            coverMediaId:
              form.coverMediaId,
            videoMediaId:
              form.videoMediaId,
            galleryMediaIds:
              form.galleryMediaIds,
            productIds:
              form.productIds,
            featured:
              form.featured,
            sortOrder:
              form.sortOrder,
            status:
              form.status,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as
          | ApiResponse<Realization>
          | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Enregistrement impossible.',
        );
      }

      setForm(emptyForm);
      setEditingId(null);
      setSuccess(
        'Réalisation enregistrée.',
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Enregistrement impossible.',
      );
    }
  }

  async function remove(id: number) {
    if (
      !window.confirm(
        'Supprimer cette réalisation ?',
      )
    ) {
      return;
    }

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/content/realizations/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const payload =
          (await response
            .json()
            .catch(() => null)) as
            | ApiResponse<unknown>
            | null;

        throw new Error(
          payload?.message ??
            'Suppression impossible.',
        );
      }

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Suppression impossible.',
      );
    }
  }

  function edit(
    item: Realization,
  ) {
    setEditingId(item.id);

    setForm({
      categoryId:
        item.categoryId,
      serviceId:
        item.serviceId,
      title: item.title,
      location:
        item.location ?? '',
      projectDate:
        item.projectDate
          ? item.projectDate.slice(
              0,
              10,
            )
          : '',
      projectYear:
        item.projectYear === null
          ? ''
          : String(
              item.projectYear,
            ),
      summary:
        item.summary ?? '',
      description:
        item.description ?? '',
      technicalAttributes:
        normalizeTechnical(
          item.technicalAttributes,
        ),
      coverMediaId:
        item.coverMediaId,
      videoMediaId:
        item.videoMediaId,
      galleryMediaIds:
        item.gallery.map(
          (link) =>
            link.media.id,
        ),
      productIds:
        item.products.map(
          (link) =>
            link.product.id,
        ),
      featured:
        item.featured,
      sortOrder:
        item.sortOrder,
      status: item.status,
    });
  }

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div
          className={[
            'rounded-xl p-4 text-sm font-semibold',
            error
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700',
          ].join(' ')}
        >
          {error ?? success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">
          Catégories de réalisations
        </h2>

        <form
          onSubmit={saveCategory}
          className="mt-5 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]"
        >
          <input
            required
            value={categoryName}
            placeholder="Nom de la catégorie"
            onChange={(event) =>
              setCategoryName(
                event.target.value,
              )
            }
            className="min-h-11 rounded-xl border border-slate-200 px-3"
          />

          <input
            value={
              categoryDescription
            }
            placeholder="Description"
            onChange={(event) =>
              setCategoryDescription(
                event.target.value,
              )
            }
            className="min-h-11 rounded-xl border border-slate-200 px-3"
          />

          <button
            type="submit"
            className="min-h-11 rounded-xl bg-slate-900 px-4 font-semibold text-white"
          >
            {categoryEditingId
              ? 'Enregistrer'
              : 'Ajouter'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map(
            (category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCategoryEditingId(
                    category.id,
                  );
                  setCategoryName(
                    category.name,
                  );
                  setCategoryDescription(
                    category.description ??
                      '',
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold"
              >
                {category.name}
                <Pencil size={14} />
              </button>
            ),
          )}
        </div>
      </section>

      <form
        onSubmit={
          saveRealization
        }
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold">
            {editingId
              ? 'Modifier la réalisation'
              : 'Nouvelle réalisation'}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <X size={16} />
              Annuler
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">
              Catégorie *
            </span>

            <select
              required
              value={
                form.categoryId ||
                ''
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    categoryId:
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
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Service associé
            </span>

            <select
              value={
                form.serviceId ??
                ''
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    serviceId:
                      event.target
                        .value
                        ? Number(
                            event
                              .target
                              .value,
                          )
                        : null,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="">
                Aucun
              </option>

              {services.map(
                (service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Titre *
            </span>

            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Lieu
            </span>

            <input
              value={form.location}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    location:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Année
            </span>

            <input
              type="number"
              min={1900}
              max={2100}
              value={
                form.projectYear
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    projectYear:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Date du projet
            </span>

            <input
              type="date"
              value={
                form.projectDate
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    projectDate:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Statut
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    status:
                      event.target
                        .value as
                        | 'DRAFT'
                        | 'PUBLISHED',
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            >
              <option value="DRAFT">
                Brouillon
              </option>
              <option value="PUBLISHED">
                Publiée
              </option>
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Résumé
            </span>

            <textarea
              rows={3}
              value={form.summary}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    summary:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Description
            </span>

            <textarea
              rows={8}
              value={
                form.description
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }),
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <div className="md:col-span-2 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">
                Données techniques
              </p>

              <button
                type="button"
                onClick={() =>
                  setForm(
                    (current) => ({
                      ...current,
                      technicalAttributes:
                        [
                          ...current.technicalAttributes,
                          {
                            label: '',
                            value: '',
                          },
                        ],
                    }),
                  )
                }
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                Ajouter
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {form.technicalAttributes.map(
                (item, index) => (
                  <div
                    key={index}
                    className="grid gap-2 md:grid-cols-[1fr_1.5fr_auto]"
                  >
                    <input
                      value={
                        item.label
                      }
                      placeholder="Nom"
                      onChange={(event) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            technicalAttributes:
                              current.technicalAttributes.map(
                                (
                                  attribute,
                                  itemIndex,
                                ) =>
                                  itemIndex ===
                                  index
                                    ? {
                                        ...attribute,
                                        label:
                                          event
                                            .target
                                            .value,
                                      }
                                    : attribute,
                              ),
                          }),
                        )
                      }
                      className="min-h-10 rounded-lg border border-slate-200 px-3"
                    />

                    <input
                      value={
                        item.value
                      }
                      placeholder="Valeur"
                      onChange={(event) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            technicalAttributes:
                              current.technicalAttributes.map(
                                (
                                  attribute,
                                  itemIndex,
                                ) =>
                                  itemIndex ===
                                  index
                                    ? {
                                        ...attribute,
                                        value:
                                          event
                                            .target
                                            .value,
                                      }
                                    : attribute,
                              ),
                          }),
                        )
                      }
                      className="min-h-10 rounded-lg border border-slate-200 px-3"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            technicalAttributes:
                              current.technicalAttributes.filter(
                                (
                                  _,
                                  itemIndex,
                                ) =>
                                  itemIndex !==
                                  index,
                              ),
                          }),
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-600"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>

          <AdminMediaSelect
            label="Image de couverture"
            type="IMAGE"
            value={
              form.coverMediaId
            }
            onChange={(value) =>
              setForm(
                (current) => ({
                  ...current,
                  coverMediaId:
                    value,
                }),
              )
            }
          />

          <AdminMediaSelect
            label="Vidéo"
            type="VIDEO"
            value={
              form.videoMediaId
            }
            onChange={(value) =>
              setForm(
                (current) => ({
                  ...current,
                  videoMediaId:
                    value,
                }),
              )
            }
          />

          <div className="md:col-span-2">
            <AdminMediaMultiSelect
              label="Galerie photos"
              value={
                form.galleryMediaIds
              }
              limit={30}
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    galleryMediaIds:
                      value,
                  }),
                )
              }
            />
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-semibold">
              Produits associés
            </p>

            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(
                (product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(
                        product.id,
                      )}
                      onChange={() =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            productIds:
                              current.productIds.includes(
                                product.id,
                              )
                                ? current.productIds.filter(
                                    (
                                      id,
                                    ) =>
                                      id !==
                                      product.id,
                                  )
                                : [
                                    ...current.productIds,
                                    product.id,
                                  ],
                          }),
                        )
                      }
                    />

                    <span>
                      <strong>
                        {
                          product.name
                        }
                      </strong>
                      <br />
                      <small className="text-slate-500">
                        {product.sku}
                      </small>
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <label>
            <span className="text-sm font-semibold">
              Ordre
            </span>

            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    sortOrder:
                      Number(
                        event.target.value,
                      ),
                  }),
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={
                form.featured
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    featured:
                      event.target.checked,
                  }),
                )
              }
            />
            Mettre en avant
          </label>

          <button
            type="submit"
            className="md:col-span-2 min-h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white"
          >
            {editingId
              ? 'Enregistrer les modifications'
              : 'Créer la réalisation'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-extrabold">
            Réalisations
          </h2>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Chargement...
          </p>
        ) : realizations.length ===
          0 ? (
          <p className="p-6 text-slate-500">
            Aucune réalisation.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {realizations.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-bold">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.status ===
                      'PUBLISHED'
                        ? 'Publiée'
                        : 'Brouillon'}
                      {item.projectYear
                        ? ` • ${item.projectYear}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        edit(item)
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void remove(
                          item.id,
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
