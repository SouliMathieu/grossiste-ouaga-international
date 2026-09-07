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
  shortDescription: string | null;
  description: string | null;
  price: number | null;
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
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
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
  sku: '',
  name: '',
  shortDescription: '',
  description: '',
  price: '',
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
      sku: product.sku,
      name: product.name,
      shortDescription:
        product.shortDescription ?? '',
      description: product.description ?? '',
      price:
        product.price === null
          ? ''
          : String(product.price),
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

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        categoryId,
        sku: form.sku.trim(),
        name: form.name.trim(),
        shortDescription:
          form.shortDescription.trim() || null,
        description:
          form.description.trim() || null,
        price:
          form.price.trim() === ''
            ? null
            : Number(form.price),
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
      className="mt-14 border-t border-slate-300 pt-10"
    >
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Catalogue
        </p>

        <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
          Gestion des produits
        </h2>

        <p className="mt-2 text-slate-500">
          Créez, modifiez, publiez ou archivez les
          produits affichés sur la boutique.
        </p>
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
        className="mt-8 rounded-xl bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">
            {editingId
              ? 'Modifier le produit'
              : 'Nouveau produit'}
          </h3>

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
              SKU *
            </span>

            <input
              required
              value={form.sku}
              onChange={(event) =>
                updateField(
                  'sku',
                  event.target.value,
                )
              }
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
              value={form.price}
              onChange={(event) =>
                updateField(
                  'price',
                  event.target.value,
                )
              }
              placeholder="Vide = prix sur devis"
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
            />
          </label>

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
          <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
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
                      {product.availability}
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
