import { adminFetch } from '../lib/admin-fetch';
import {
  ProductMediaFields,
} from './ProductMediaFields';
import {
  ProductAttributesFields,
  type ProductAttributeInput,
} from './ProductAttributesFields';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  ProductCategoriesPanel,
} from './ProductCategoriesPanel';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

type ProductMediaAsset = {
  id: number;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  status: string;
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
  mainMedia: ProductMediaAsset | null;
  galleryMedia: ProductMediaAsset[];
  datasheetMedia: ProductMediaAsset | null;
  attributes: Array<{
    id: number;
    name: string;
    value: string;
    sortOrder: number;
  }>;
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
  mainMediaId: number | null;
  galleryMediaIds: number[];
  datasheetMediaId: number | null;
  attributes: ProductAttributeInput[];
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
  mainMediaId: null,
  galleryMediaIds: [],
  datasheetMediaId: null,
  attributes: [],
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

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [catalogView, setCatalogView] =
    useState<'PRODUCTS' | 'CATEGORIES'>(
      'PRODUCTS',
    );

  const [searchQuery, setSearchQuery] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('ALL');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

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
        adminFetch(
          `${API_BASE_URL}/api/admin/catalog/categories`,
          {
            credentials: 'include',
          },
        ),
        adminFetch(
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
            categoriesPayload.data?.find(
              (category) =>
                category.active,
            )?.id ?? '',
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

  const normalizedSearch =
    searchQuery.trim().toLocaleLowerCase('fr');

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch =
        normalizedSearch === '' ||
        [
          product.name,
          product.sku,
          product.brand ?? '',
          product.category.name,
        ].some((value) =>
          value
            .toLocaleLowerCase('fr')
            .includes(normalizedSearch),
        );

      const matchesCategory =
        categoryFilter === 'ALL' ||
        String(product.categoryId) ===
          categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        product.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    },
  );

  function updateField<
    K extends keyof ProductForm,
  >(
    field: K,
    value: ProductForm[K],
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
        categories.find(
          (category) => category.active,
        )?.id ?? '',
      ),
    });

    setIsFormOpen(true);
  }

  function closeProductForm() {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingId(null);
    setError(null);

    setForm({
      ...emptyForm,
      categoryId: String(
        categories.find(
          (category) => category.active,
        )?.id ?? '',
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
      mainMediaId:
        product.mainMedia?.id ?? null,
      galleryMediaIds:
        product.galleryMedia.map(
          (item) => item.id,
        ),
      datasheetMediaId:
        product.datasheetMedia?.id ??
        null,
      attributes:
        product.attributes.map(
          (attribute) => ({
            name: attribute.name,
            value: attribute.value,
          }),
        ),
      keywords: product.keywords ?? '',
    });

    setIsFormOpen(true);
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
        mainMediaId:
          form.mainMediaId,
        galleryMediaIds:
          form.galleryMediaIds,
        datasheetMediaId:
          form.datasheetMediaId,
        attributes:
          form.attributes
            .filter(
              (attribute) =>
                attribute.name.trim() !== '' &&
                attribute.value.trim() !== '',
            )
            .map((attribute) => ({
              name:
                attribute.name.trim(),
              value:
                attribute.value.trim(),
            })),
        keywords:
          form.keywords.trim() || null,
      };

      const response = await adminFetch(
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

      setIsFormOpen(false);
      setEditingId(null);

      setForm({
        ...emptyForm,
        categoryId: String(
          categories.find(
          (category) => category.active,
        )?.id ?? '',
        ),
      });

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
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/catalog/products/${product.id}/archive`,
        {
          method: 'PATCH',
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


  async function deleteProduct(
    product: Product,
  ) {
    const confirmed =
      window.confirm(
        `Supprimer définitivement "${product.name}" ?

Cette action est irréversible.

Les anciennes commandes conserveront leurs informations historiques.`,
      );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response =
        await adminFetch(
          `${API_BASE_URL}/api/admin/catalog/products/${product.id}`,
          {
            method: 'DELETE',
            credentials:
              'include',
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
            'Impossible de supprimer définitivement le produit.',
        );
      }

      await loadData();

      setSuccess(
        'Produit supprimé définitivement.',
      );
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
      <div>
        <h2 className="text-2xl font-bold text-slate-950">
          Catalogue
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Gérez les produits et les catégories de la boutique GOI.
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

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setCatalogView('PRODUCTS')
          }
          className={`min-h-10 rounded-lg px-5 text-sm font-semibold transition ${
            catalogView === 'PRODUCTS'
              ? 'bg-[#0E3B2E] text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Produits
        </button>

        <button
          type="button"
          onClick={() =>
            setCatalogView('CATEGORIES')
          }
          className={`min-h-10 rounded-lg px-5 text-sm font-semibold transition ${
            catalogView === 'CATEGORIES'
              ? 'bg-[#0E3B2E] text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Catégories
        </button>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeProductForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-form-title"
            className="h-full w-full max-w-5xl overflow-y-auto bg-[#F4F6F2] shadow-2xl"
          >
            <form
              id="catalog-form"
              onSubmit={handleSubmit}
              className="min-h-full p-5 sm:p-6 lg:p-8"
            >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3
              id="catalog-form-title"
              className="text-xl font-bold text-slate-900"
            >
              {editingId
                ? 'Modifier le produit'
                : 'Nouveau produit'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              La référence GOI et l’adresse web sont générées automatiquement.
            </p>
          </div>

          <button
            type="button"
            onClick={closeProductForm}
            disabled={isSaving}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Fermer
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">

          <section
            aria-labelledby="product-section-1"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                1
              </div>

              <div>
                <h4
                  id="product-section-1"
                  className="font-bold text-slate-950"
                >
                  Informations essentielles
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Identifiez clairement le produit et sa catégorie.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
              {categories
              .filter(
                (category) =>
                  category.active ||
                  String(category.id) ===
                    form.categoryId,
              )
              .map((category) => (
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


            </div>
          </section>

          <section
            aria-labelledby="product-section-2"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                2
              </div>

              <div>
                <h4
                  id="product-section-2"
                  className="font-bold text-slate-950"
                >
                  Photos du produit
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Choisissez l’image principale et les images de galerie.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
<ProductMediaFields
            mainMediaId={
              form.mainMediaId
            }
            galleryMediaIds={
              form.galleryMediaIds
            }
            categoryId={
              form.categoryId
                ? Number(
                    form.categoryId,
                  )
                : null
            }
            categoryName={
              categories.find(
                (category) =>
                  String(
                    category.id,
                  ) ===
                  form.categoryId,
              )?.name ?? null
            }
            onMainMediaChange={(
              mediaId,
            ) =>
              updateField(
                'mainMediaId',
                mediaId,
              )
            }
            onGalleryMediaChange={(
              mediaIds,
            ) =>
              updateField(
                'galleryMediaIds',
                mediaIds,
              )
            }
          />


            </div>
          </section>

          <section
            aria-labelledby="product-section-3"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                3
              </div>

              <div>
                <h4
                  id="product-section-3"
                  className="font-bold text-slate-950"
                >
                  Description
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Présentez le produit avec des informations utiles aux clients.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
          </section>

          <section
            aria-labelledby="product-section-4"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                4
              </div>

              <div>
                <h4
                  id="product-section-4"
                  className="font-bold text-slate-950"
                >
                  Caractéristiques
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Ajoutez librement les caractéristiques techniques du produit.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
<ProductAttributesFields
            value={form.attributes}
            onChange={(attributes) =>
              updateField(
                'attributes',
                attributes,
              )
            }
          />


            </div>
          </section>

          <section
            aria-labelledby="product-section-5"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                5
              </div>

              <div>
                <h4
                  id="product-section-5"
                  className="font-bold text-slate-950"
                >
                  Vente et stock
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Configurez le prix et la disponibilité.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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


            </div>
          </section>

          <section
            aria-labelledby="product-section-6"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                6
              </div>

              <div>
                <h4
                  id="product-section-6"
                  className="font-bold text-slate-950"
                >
                  Promotion
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Configurez une remise temporaire uniquement si nécessaire.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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


            </div>
          </section>

          <section
            aria-labelledby="product-section-7"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E] text-xs font-bold text-white">
                7
              </div>

              <div>
                <h4
                  id="product-section-7"
                  className="font-bold text-slate-950"
                >
                  Publication
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Choisissez la visibilité du produit et sa mise en avant.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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


            </div>
          </section>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 min-h-12 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-[#1F7A4D] disabled:opacity-60"
        >
          {isSaving
            ? 'Enregistrement...'
            : editingId
              ? 'Enregistrer les modifications'
              : 'Créer le produit'}
        </button>
            </form>
          </div>
        </div>
      )}

      {catalogView === 'CATEGORIES' && (
        <div className="mt-8">
          <ProductCategoriesPanel
            categories={categories}
            isLoading={isLoading}
            onRefresh={loadData}
          />
        </div>
      )}

      <div
        className={
          catalogView === 'PRODUCTS'
            ? 'mt-8'
            : 'hidden'
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950">
                Catalogue produits
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
                {' '}sur {products.length} produit{products.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void loadData()
                }
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Actualiser
              </button>

              <button
                type="button"
                onClick={startCreate}
                className="min-h-10 rounded-lg bg-[#0E3B2E] px-4 text-sm font-semibold text-white hover:bg-[#1F7A4D]"
              >
                + Nouveau produit
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label>
              <span className="sr-only">
                Rechercher un produit
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Rechercher par nom, référence ou marque..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/15"
              />
            </label>

            <label>
              <span className="sr-only">
                Filtrer par catégorie
              </span>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="ALL">
                  Toutes les catégories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={String(category.id)}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">
                Filtrer par statut
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="ALL">
                  Tous les statuts
                </option>
                <option value="PUBLISHED">
                  Publiés
                </option>
                <option value="DRAFT">
                  Brouillons
                </option>
                <option value="ARCHIVED">
                  Archivés
                </option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Chargement...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <h4 className="font-bold text-slate-900">
              Aucun produit trouvé
            </h4>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Aucun produit ne correspond actuellement à votre recherche ou aux filtres sélectionnés.
            </p>

            {(searchQuery !== '' ||
              categoryFilter !== 'ALL' ||
              statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-5 min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0E3B2E] hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="p-4">
                      <div className="flex min-w-[240px] items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {(
                            product.mainMedia?.secureUrl ??
                            product.imageUrl
                          ) ? (
                            <img
                              src={
                                product.mainMedia?.secureUrl ??
                                product.imageUrl ??
                                undefined
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              GOI
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {product.category.name}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatPrice(product.price)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : product.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {getAvailabilityLabel(product.availability)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(product)
                          }
                          className="min-h-10 rounded-lg bg-blue-50 px-3 font-semibold text-blue-700"
                        >
                          Modifier
                        </button>

                        {product.status ===
                          'PUBLISHED' && (
                          <Link
                            to={`/publicites?productId=${product.id}`}
                            className="inline-flex min-h-10 items-center rounded-lg bg-emerald-50 px-3 font-semibold text-emerald-700"
                          >
                            Faire une publicité
                          </Link>
                        )}

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

                        <button
                          type="button"
                          onClick={() =>
                            void deleteProduct(
                              product,
                            )
                          }
                          className="min-h-10 rounded-lg border border-red-200 bg-white px-3 font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Supprimer définitivement
                        </button>
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
