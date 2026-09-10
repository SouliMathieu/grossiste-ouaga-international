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

export type PublicService = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description?: string | null;
  coverMedia: ContentMedia | null;
};

export type PublicRealization = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  location: string | null;
  projectDate?: string | null;
  date?: string | null;
  coverMedia: ContentMedia | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export type HomeContent = {
  slides: HomeSlide[];
  trustCards: TrustCard[];
  services: PublicService[];
  realizations: PublicRealization[];
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
    (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(
      payload.message ??
        'Impossible de charger le contenu.',
    );
  }

  return payload.data;
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
    trustCards: data?.trustCards ?? [],
    services: data?.services ?? [],
    realizations: data?.realizations ?? [],
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

export async function getRealizations(
  signal?: AbortSignal,
) {
  return (
    (await getJson<PublicRealization[]>(
      `${API_BASE_URL}/api/content/realizations`,
      signal,
    )) ?? []
  );
}

export function getWhatsAppUrl(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}
