const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export type ProductAvailability =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'ON_ORDER';

export type CatalogMediaAsset = {
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
  status: string;
};

export type CatalogProductAttribute = {
  id: number;
  name: string;
  value: string;
  sortOrder: number;
};

export type CatalogProduct = {
  id: number;
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
  promotionActive: boolean;
  currentPrice: number | null;

  currency: string;
  unit: string;
  minOrderQty: number;
  packSize: number;

  availability: ProductAvailability;
  stockQuantity: number | null;

  featured: boolean;

  imageUrl: string | null;
  mainMedia: CatalogMediaAsset | null;
  galleryMedia: CatalogMediaAsset[];
  datasheetMedia: CatalogMediaAsset | null;

  attributes: CatalogProductAttribute[];

  createdAt: string;

  category: {
    id: number;
    name: string;
    slug: string;
  };
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

export type CatalogProductQuery = {
  q?: string;
  category?: string;
  availability?: ProductAvailability;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?:
    | 'newest'
    | 'price_asc'
    | 'price_desc'
    | 'name_asc';
};

async function requestData<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      signal: signal ?? null,
    },
  );

  const payload =
    (await response
      .json()
      .catch(() => null)) as
      | ApiResponse<T>
      | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        'Impossible de récupérer les informations demandées.',
    );
  }

  if (
    payload?.data === undefined
  ) {
    throw new Error(
      'La réponse du serveur est incomplète.',
    );
  }

  return payload.data;
}

export function getCategories(
  signal?: AbortSignal,
) {
  return requestData<
    CatalogCategory[]
  >(
    '/api/catalog/categories',
    signal,
  );
}

export function getProducts(
  query: CatalogProductQuery = {},
  signal?: AbortSignal,
) {
  const params =
    new URLSearchParams();

  if (query.q) {
    params.set('q', query.q);
  }

  if (query.category) {
    params.set(
      'category',
      query.category,
    );
  }

  if (query.availability) {
    params.set(
      'availability',
      query.availability,
    );
  }

  if (
    query.minPrice !== undefined
  ) {
    params.set(
      'minPrice',
      String(query.minPrice),
    );
  }

  if (
    query.maxPrice !== undefined
  ) {
    params.set(
      'maxPrice',
      String(query.maxPrice),
    );
  }

  if (
    query.featured !== undefined
  ) {
    params.set(
      'featured',
      String(query.featured),
    );
  }

  if (query.sort) {
    params.set(
      'sort',
      query.sort,
    );
  }

  const search =
    params.toString();

  return requestData<
    CatalogProduct[]
  >(
    `/api/catalog/products${
      search
        ? `?${search}`
        : ''
    }`,
    signal,
  );
}

export function getProduct(
  slug: string,
  signal?: AbortSignal,
) {
  return requestData<
    CatalogProduct
  >(
    `/api/catalog/products/${encodeURIComponent(
      slug,
    )}`,
    signal,
  );
}

export function getAvailabilityLabel(
  availability: ProductAvailability,
) {
  switch (availability) {
    case 'IN_STOCK':
      return 'En stock';

    case 'LOW_STOCK':
      return 'Stock faible';

    case 'OUT_OF_STOCK':
      return 'Indisponible';

    case 'ON_ORDER':
      return 'Sur commande';
  }
}

export function getEffectivePrice(
  product: CatalogProduct,
) {
  return (
    product.currentPrice ??
    product.price
  );
}

export function isPurchasable(
  product: CatalogProduct,
) {
  return (
    !product.priceOnRequest &&
    getEffectivePrice(product) !==
      null &&
    product.availability !==
      'OUT_OF_STOCK'
  );
}
