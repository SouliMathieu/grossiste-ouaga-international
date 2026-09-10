const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

export type ContentMedia = {
  id: number;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width: number | null;
  height: number | null;
  format: string | null;
  alt: string | null;
  caption: string | null;
};

export type CompanySettings = {
  id: number;
  businessName: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hoursText: string | null;
  mapsUrl: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  logoMedia: ContentMedia | null;
  faviconMedia: ContentMedia | null;
};

export type HomeSlide = {
  id: number;
  eyebrow: string | null;
  title: string;
  text: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  active: boolean;
  sortOrder: number;
  imageMedia: ContentMedia | null;
};

export type TrustCard = {
  id: number;
  icon: string | null;
  title: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

export type LinkedProduct = {
  id: number;
  slug: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  price?: number | string | null;
  priceOnRequest?: boolean;
};

export type PublicService = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description?: string | null;
  coverMedia: ContentMedia | null;
};

export type ServiceDetail = PublicService & {
  description: string | null;
  gallery: Array<{
    id: number;
    sortOrder: number;
    media: ContentMedia;
  }>;
  products: LinkedProduct[];
};

export type RealizationCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type PublicRealization = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description?: string | null;
  location: string | null;
  projectDate: string | null;
  projectYear: number | null;
  featured?: boolean;
  coverMedia: ContentMedia | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  service?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export type RealizationDetail =
  PublicRealization & {
    description: string | null;
    technicalAttributes: unknown;
    videoMedia: ContentMedia | null;
    gallery: Array<{
      id: number;
      sortOrder: number;
      media: ContentMedia;
    }>;
    products: LinkedProduct[];
  };

export type AboutContent = {
  id: number;
  heroTitle: string | null;
  heroText: string | null;
  heroVideo: ContentMedia | null;
  heroPoster: ContentMedia | null;
  introTitle: string | null;
  introText: string | null;
  introMedia: ContentMedia | null;
  implantationTitle: string | null;
  implantationText: string | null;
  missionTitle: string | null;
  missionText: string | null;
  missionMedia: ContentMedia | null;
  valuesTitle: string | null;
  values: unknown;
  strengthsTitle: string | null;
  strengths: unknown;
  strengthsMedia: ContentMedia | null;
};

export type HomeContent = {
  slides: HomeSlide[];
  trustCards: TrustCard[];
  services: PublicService[];
  realizations: PublicRealization[];
};

export type ContactMessageInput = {
  subject: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

async function getJson<T>(
  url: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    url,
    signal
      ? {
          signal,
        }
      : undefined,
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
        'Impossible de charger le contenu.',
    );
  }

  return payload?.data;
}

export async function getCompany(
  signal?: AbortSignal,
) {
  return (
    (await getJson<CompanySettings | null>(
      `${API_BASE_URL}/api/content/company`,
      signal,
    )) ?? null
  );
}

export async function getHomeContent(
  signal?: AbortSignal,
) {
  const data =
    await getJson<HomeContent>(
      `${API_BASE_URL}/api/content/home`,
      signal,
    );

  return {
    slides: data?.slides ?? [],
    trustCards:
      data?.trustCards ?? [],
    services: data?.services ?? [],
    realizations:
      data?.realizations ?? [],
  };
}

export async function getServices(
  signal?: AbortSignal,
) {
  return (
    (await getJson<PublicService[]>(
      `${API_BASE_URL}/api/content/services`,
      signal,
    )) ?? []
  );
}

export async function getService(
  slug: string,
  signal?: AbortSignal,
) {
  return getJson<ServiceDetail>(
    `${API_BASE_URL}/api/content/services/${encodeURIComponent(
      slug,
    )}`,
    signal,
  );
}

export async function getRealizationCategories(
  signal?: AbortSignal,
) {
  return (
    (await getJson<
      RealizationCategory[]
    >(
      `${API_BASE_URL}/api/content/realisation-categories`,
      signal,
    )) ?? []
  );
}

export async function getRealizations(
  signal?: AbortSignal,
) {
  return (
    (await getJson<
      PublicRealization[]
    >(
      `${API_BASE_URL}/api/content/realisations`,
      signal,
    )) ?? []
  );
}

export async function getRealization(
  slug: string,
  signal?: AbortSignal,
) {
  return getJson<RealizationDetail>(
    `${API_BASE_URL}/api/content/realisations/${encodeURIComponent(
      slug,
    )}`,
    signal,
  );
}

export async function getAbout(
  signal?: AbortSignal,
) {
  return (
    (await getJson<AboutContent | null>(
      `${API_BASE_URL}/api/content/about`,
      signal,
    )) ?? null
  );
}

export async function submitContactMessage(
  input: ContactMessageInput,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/contact/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  const payload =
    (await response
      .json()
      .catch(() => null)) as
      | ApiResponse<unknown>
      | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        'Impossible d’envoyer votre message.',
    );
  }
}

export function getWhatsAppUrl(
  value: string | null | undefined,
  message?: string,
) {
  if (!value) {
    return null;
  }

  const digits =
    value.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  const query = message
    ? `?text=${encodeURIComponent(
        message,
      )}`
    : '';

  return `https://wa.me/${digits}${query}`;
}
