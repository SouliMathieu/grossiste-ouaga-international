import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  categoryId: number;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  priceOnRequest: boolean;
  promoPrice: number | null;
  promoStartAt: string | null;
  promoEndAt: string | null;
  currency: string;
  unit: string;
  minOrderQty: number;
  packSize: number;
  availability: string;
  stockQuantity: number | null;
  featured: boolean;
  status: string;
  imageUrl: string | null;
  keywords: string | null;
  category: Category;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type ProductForm = {
  categoryId: string;
  name: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: string;
  priceOnRequest: boolean;
  promoPrice: string;
  promoStartAt: string;
  promoEndAt: string;
  unit: string;
  minOrderQty: string;
  packSize: string;
  availability: string;
  stockQuantity: string;
  featured: boolean;
  status: string;
  imageUrl: string;
  keywords: string;
};

const emptyForm: ProductForm = {
  categoryId: '',
  name: '',
  brand: '',
  shortDescription: '',
  description: '',
  price: '',
  priceOnRequest: false,
  promoPrice: '',
  promoStartAt: '',
  promoEndAt: '',
  unit: 'pièce',
  minOrderQty: '1',
  packSize: '1',
  availability: 'IN_STOCK',
  stockQuantity: '',
  featured: false,
  status: 'PUBLISHED',
  imageUrl: '',
  keywords: '',
};

const formatPrice = (value: number | null) =>
  value === null
    ? 'Sur devis'
    : `${new Intl.NumberFormat('fr-FR').format(
        value,
      )} FCFA`;

function getStatusLabel(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'Publié';
    case 'DRAFT':
      return 'Brouillon';
    case 'ARCHIVED':
      return 'Archivé';
    default:
      return status;
  }
}

function getAvailabilityLabel(status: string) {
  switch (status) {
    case 'IN_STOCK':
      return 'En stock';
    case 'LOW_STOCK':
      return 'Stock faible';
    case 'OUT_OF_STOCK':
      return 'Rupture';
    case 'ON_ORDER':
      return 'Sur commande';
    default:
      return status;
  }
}


export function CatalogAdminPanel() {
  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [
        categoriesResponse,
        productsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/catalog/categories`,
        ),
        fetch(
          `${API_BASE_URL}/api/admin/catalog/products`,
          {
            credentials: 'include',
          },
        ),
      ]);

      const categoriesPayload =
        (await categoriesResponse.json()) as
          ApiResponse<Category[]>;

      const productsPayload =
        (await productsResponse.json()) as
          ApiResponse<Product[]>;

      if (!categoriesResponse.ok) {
        throw new Error(
          categoriesPayload.message ??
            'Impossible de charger les catégories.',
        );
      }

      if (!productsResponse.ok) {
        throw new Error(
          productsPayload.message ??
            'Impossible de charger les produits.',
        );
      }

      setCategories(
        categoriesPayload.data ?? [],
      );

      setProducts(productsPayload.data ?? []);

      setForm((current) => ({
        ...current,
        categoryId:
          current.categoryId ||
          String(
            categoriesPayload.data?.[0]?.id ?? '',
          ),
      }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateField(
    field: keyof ProductForm,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setError(null);
    setSuccess(null);

    setForm({
      ...emptyForm,
      categoryId: String(
        categories[0]?.id ?? '',
      ),
    });
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setError(null);
    setSuccess(null);

    setForm({
      categoryId: String(product.categoryId),
      name: product.name,
      brand: product.brand ?? '',
      shortDescription:
        product.shortDescription ?? '',
      description: product.description ?? '',
      price:
        product.price === null
          ? ''
          : String(product.price),
      priceOnRequest: product.priceOnRequest,
      promoPrice:
        product.promoPrice === null
          ? ''
          : String(product.promoPrice),
      promoStartAt:
        product.promoStartAt?.slice(0, 10) ?? '',
      promoEndAt:
        product.promoEndAt?.slice(0, 10) ?? '',
      unit: product.unit,
      minOrderQty: String(product.minOrderQty),
      packSize: String(product.packSize),
      availability: product.availability,
      stockQuantity:
        product.stockQuantity === null
          ? ''
          : String(product.stockQuantity),
      featured: product.featured,
      status: product.status,
      imageUrl: product.imageUrl ?? '',
      keywords: product.keywords ?? '',
    });

    document
      .getElementById('catalog-form')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const categoryId = Number(form.categoryId);
    const minOrderQty = Number(form.minOrderQty);
    const packSize = Number(form.packSize);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      setError(
        'Sélectionnez une catégorie valide.',
      );
      return;
    }

    if (
      !Number.isInteger(minOrderQty) ||
      minOrderQty <= 0 ||
      !Number.isInteger(packSize) ||
      packSize <= 0
    ) {
      setError(
        'MOQ et conditionnement doivent être supérieurs à zéro.',
      );
      return;
    }

    if (
      !form.priceOnRequest &&
      form.price.trim() === ''
    ) {
      setError(
        'Renseignez un prix ou activez « Prix sur devis ».',
      );
      return;
    }

    if (
      !form.priceOnRequest &&
      form.promoPrice.trim() !== ''
    ) {
      const normalPrice = Number(form.price);
      const promoPrice = Number(form.promoPrice);

      if (
        !Number.isFinite(promoPrice) ||
        promoPrice < 0 ||
        promoPrice >= normalPrice
      ) {
        setError(
          'Le prix promotionnel doit être inférieur au prix normal.',
        );
        return;
      }

      if (
        form.promoStartAt === '' ||
        form.promoEndAt === ''
      ) {
        setError(
          'Renseignez les dates de début et de fin de la promotion.',
        );
        return;
      }

      if (form.promoStartAt > form.promoEndAt) {
        setError(
          'La date de fin de promotion doit être postérieure à la date de début.',
        );
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        categoryId,
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        shortDescription:
          form.shortDescription.trim() || null,
        description:
          form.description.trim() || null,
        price: form.priceOnRequest
          ? null
          : form.price.trim() === ''
            ? null
            : Number(form.price),
        priceOnRequest: form.priceOnRequest,
        promoPrice:
          form.priceOnRequest ||
          form.promoPrice.trim() === ''
            ? null
            : Number(form.promoPrice),
        promoStartAt:
          form.priceOnRequest ||
          form.promoStartAt === ''
            ? null
            : `${form.promoStartAt}T00:00:00.000Z`,
        promoEndAt:
          form.priceOnRequest ||
          form.promoEndAt === ''
            ? null
            : `${form.promoEndAt}T23:59:59.999Z`,
        unit: form.unit.trim(),
        minOrderQty,
        packSize,
        availability: form.availability,
        stockQuantity:
          form.stockQuantity.trim() === ''
            ? null
            : Number(form.stockQuantity),
        featured: form.featured,
        status: form.status,
        imageUrl:
          form.imageUrl.trim() || null,
        keywords:
          form.keywords.trim() || null,
      };

      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/api/admin/catalog/products/${editingId}`
          : `${API_BASE_URL}/api/admin/catalog/products`,
        {
          method: editingId
            ? 'PATCH'
            : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const result =
        (await response.json()) as
          ApiResponse<Product>;

      if (!response.ok) {
        throw new Error(
          result.message ??
            'Impossible d’enregistrer le produit.',
        );
      }

      setSuccess(
        editingId
          ? 'Produit modifié.'
          : 'Produit créé.',
      );

      startCreate();
      await loadData();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveProduct(
    product: Product,
  ) {
    const confirmed = window.confirm(
      `Archiver "${product.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/catalog/products/${product.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const payload =
          (await response
            .json()
            .catch(() => null)) as
            ApiResponse<unknown> | null;

        throw new Error(
          payload?.message ??
            'Impossible d’archiver le produit.',
        );
      }

      await loadData();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    }
  }

  return (
    <section
      id="catalog-admin"
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Produits
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Créez, modifiez, publiez ou archivez les références de la boutique.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <form
        id="catalog-form"
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {editingId
                ? 'Modifier le produit'
                : 'Nouveau produit'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              La référence GOI et l’adresse web sont générées automatiquement.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold"
            >
              Nouveau produit
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
              value={form.categoryId}
              onChange={(event) =>
                updateField(
                  'categoryId',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-3"
            >
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Marque / fabricant
            </span>

            <input
              value={form.brand}
              onChange={(event) =>
                updateField(
                  'brand',
                  event.target.value,
                )
              }
              placeholder="Optionnel"
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Nom *
            </span>

            <input
              required
              value={form.name}
              onChange={(event) =>
                updateField(
                  'name',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Description courte
            </span>

            <input
              value={form.shortDescription}
              onChange={(event) =>
                updateField(
                  'shortDescription',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Description
            </span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField(
                  'description',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-200 p-4"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Prix FCFA
            </span>

            <input
              type="number"
              min="0"
              step="1"
              disabled={form.priceOnRequest}
              value={form.price}
              onChange={(event) =>
                updateField(
                  'price',
                  event.target.value,
                )
              }
              placeholder={
                form.priceOnRequest
                  ? 'Prix sur devis'
                  : 'Ex. 85000'
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="flex min-h-12 items-center gap-3 self-end rounded-lg border border-slate-200 px-4">
            <input
              type="checkbox"
              checked={form.priceOnRequest}
              onChange={(event) => {
                const checked = event.target.checked;

                setForm((current) => ({
                  ...current,
                  priceOnRequest: checked,
                  ...(checked
                    ? {
                        price: '',
                        promoPrice: '',
                        promoStartAt: '',
                        promoEndAt: '',
                      }
                    : {}),
                }));
              }}
              className="h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold">
                Prix sur devis
              </span>
              <span className="block text-xs text-slate-500">
                Le client devra demander une cotation.
              </span>
            </span>
          </label>

          {!form.priceOnRequest && (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <h4 className="font-bold text-slate-900">
                  Promotion
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Laissez vide si aucune promotion n’est prévue.
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label>
                  <span className="text-sm font-semibold">
                    Prix promotionnel
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.promoPrice}
                    onChange={(event) =>
                      updateField(
                        'promoPrice',
                        event.target.value,
                      )
                    }
                    placeholder="Ex. 75000"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Début
                  </span>

                  <input
                    type="date"
                    value={form.promoStartAt}
                    onChange={(event) =>
                      updateField(
                        'promoStartAt',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Fin
                  </span>

                  <input
                    type="date"
                    value={form.promoEndAt}
                    onChange={(event) =>
                      updateField(
                        'promoEndAt',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4"
                  />
                </label>
              </div>
            </div>
          )}

          <label>
            <span className="text-sm font-semibold">
              Unité *
            </span>

            <input
              required
              value={form.unit}
              onChange={(event) =>
                updateField(
                  'unit',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              MOQ *
            </span>

            <input
              required
              type="number"
              min="1"
              value={form.minOrderQty}
              onChange={(event) =>
                updateField(
                  'minOrderQty',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Conditionnement *
            </span>

            <input
              required
              type="number"
              min="1"
              value={form.packSize}
              onChange={(event) =>
                updateField(
                  'packSize',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Disponibilité
            </span>

            <select
              value={form.availability}
              onChange={(event) =>
                updateField(
                  'availability',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="IN_STOCK">
                En stock
              </option>
              <option value="LOW_STOCK">
                Stock faible
              </option>
              <option value="OUT_OF_STOCK">
                Rupture
              </option>
              <option value="ON_ORDER">
                Sur commande
              </option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Stock
            </span>

            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(event) =>
                updateField(
                  'stockQuantity',
                  event.target.value,
                )
              }
              placeholder="Optionnel"
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">
              Statut
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-3"
            >
              <option value="PUBLISHED">
                Publié
              </option>
              <option value="DRAFT">
                Brouillon
              </option>
              <option value="ARCHIVED">
                Archivé
              </option>
            </select>
          </label>

          <label className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                updateField(
                  'featured',
                  event.target.checked,
                )
              }
              className="size-5"
            />

            <span className="font-semibold">
              Produit vedette
            </span>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              URL image
            </span>

            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) =>
                updateField(
                  'imageUrl',
                  event.target.value,
                )
              }
              placeholder="https://..."
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold">
              Mots-clés
            </span>

            <input
              value={form.keywords}
              onChange={(event) =>
                updateField(
                  'keywords',
                  event.target.value,
                )
              }
              placeholder="solaire batterie énergie..."
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 min-h-12 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving
            ? 'Enregistrement...'
            : editingId
              ? 'Enregistrer les modifications'
              : 'Créer le produit'}
        </button>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            Produits ({products.length})
          </h3>

          <button
            type="button"
            onClick={() => void loadData()}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold"
          >
            Actualiser
          </button>
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-xl bg-white p-6">
            Chargement...
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="p-4">Produit</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Prix</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Disponibilité</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.sku}
                      </p>
                    </td>

                    <td className="p-4">
                      {product.category.name}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatPrice(product.price)}
                    </td>

                    <td className="p-4">
                      {getStatusLabel(product.status)}
                    </td>

                    <td className="p-4">
                      {getAvailabilityLabel(product.availability)}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(product)
                          }
                          className="min-h-10 rounded-lg bg-blue-50 px-3 font-semibold text-blue-700"
                        >
                          Modifier
                        </button>

                        {product.status !==
                          'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() =>
                              void archiveProduct(
                                product,
                              )
                            }
                            className="min-h-10 rounded-lg bg-red-50 px-3 font-semibold text-red-700"
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
