export type CommerceItem = {
  id: number;
  sku: string;
  name: string;
  price?: number | null;
  quantity?: number;
};

export type CommerceEvent = {
  currency?: string;
  value?: number;
  items: CommerceItem[];
  transactionId?: string;
  eventId?: string;
};

type GenericParams =
  Record<string, unknown>;

type FbqFunction = ((
  ...args: unknown[]
) => void) & {
  callMethod?: (
    ...args: unknown[]
  ) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];

    gtag?: (
      ...args: unknown[]
    ) => void;

    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

const META_PIXEL_ID =
  import.meta.env
    .VITE_META_PIXEL_ID
    ?.trim();

const GOOGLE_TAG_ID =
  import.meta.env
    .VITE_GOOGLE_TAG_ID
    ?.trim();

const GOOGLE_ADS_CONVERSION_ID =
  import.meta.env
    .VITE_GOOGLE_ADS_CONVERSION_ID
    ?.trim();

const GOOGLE_ADS_PURCHASE_LABEL =
  import.meta.env
    .VITE_GOOGLE_ADS_PURCHASE_LABEL
    ?.trim();

const GOOGLE_ADS_ORDER_LABEL =
  import.meta.env
    .VITE_GOOGLE_ADS_ORDER_LABEL
    ?.trim();

const GOOGLE_ADS_WHATSAPP_LABEL =
  import.meta.env
    .VITE_GOOGLE_ADS_WHATSAPP_LABEL
    ?.trim();

let initialized = false;

function initializeGoogle() {
  if (!GOOGLE_TAG_ID) {
    return;
  }

  window.dataLayer =
    window.dataLayer ?? [];

  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  if (
    !document.querySelector(
      'script[data-goi-google-tag]',
    )
  ) {
    const script =
      document.createElement(
        'script',
      );

    script.async = true;

    script.dataset.goiGoogleTag =
      'true';

    script.src =
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        GOOGLE_TAG_ID,
      )}`;

    document.head.appendChild(
      script,
    );
  }

  window.gtag(
    'js',
    new Date(),
  );

  window.gtag(
    'config',
    GOOGLE_TAG_ID,
    {
      send_page_view: false,
    },
  );
}

function initializeMeta() {
  if (!META_PIXEL_ID) {
    return;
  }

  if (!window.fbq) {
    const fbq = ((
      ...args: unknown[]
    ) => {
      if (fbq.callMethod) {
        fbq.callMethod(
          ...args,
        );
        return;
      }

      fbq.queue =
        fbq.queue ?? [];

      fbq.queue.push(args);
    }) as FbqFunction;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';

    window.fbq = fbq;
    window._fbq = fbq;
  }

  if (
    !document.querySelector(
      'script[data-goi-meta-pixel]',
    )
  ) {
    const script =
      document.createElement(
        'script',
      );

    script.async = true;

    script.dataset.goiMetaPixel =
      'true';

    script.src =
      'https://connect.facebook.net/en_US/fbevents.js';

    document.head.appendChild(
      script,
    );
  }

  window.fbq(
    'init',
    META_PIXEL_ID,
  );
}

export function initializeTracking() {
  if (
    initialized ||
    typeof window === 'undefined'
  ) {
    return;
  }

  initialized = true;

  initializeGoogle();
  initializeMeta();
}

function googleItems(
  items: CommerceItem[],
) {
  return items.map(
    (item) => ({
      item_id: item.sku,
      item_name: item.name,
      price:
        item.price ?? undefined,
      quantity:
        item.quantity ?? 1,
    }),
  );
}

function metaCommerce(
  event: CommerceEvent,
) {
  return {
    currency:
      event.currency ?? 'XOF',

    value:
      event.value,

    content_type: 'product',

    content_ids:
      event.items.map(
        (item) =>
          String(item.id),
      ),

    contents:
      event.items.map(
        (item) => ({
          id: String(item.id),
          quantity:
            item.quantity ?? 1,
          item_price:
            item.price ??
            undefined,
        }),
      ),
  };
}

function googleCommerce(
  event: CommerceEvent,
) {
  return {
    currency:
      event.currency ?? 'XOF',

    value:
      event.value,

    transaction_id:
      event.transactionId,

    items:
      googleItems(
        event.items,
      ),
  };
}

function sendGoogleAdsConversion(
  label:
    | string
    | undefined,
  params: GenericParams,
) {
  if (
    !GOOGLE_ADS_CONVERSION_ID ||
    !label
  ) {
    return;
  }

  window.gtag?.(
    'event',
    'conversion',
    {
      ...params,
      send_to:
        `${GOOGLE_ADS_CONVERSION_ID}/${label}`,
    },
  );
}

export function trackPageView(
  path: string,
) {
  initializeTracking();

  window.gtag?.(
    'event',
    'page_view',
    {
      page_location:
        window.location.href,
      page_path: path,
      page_title:
        document.title,
    },
  );

  window.fbq?.(
    'track',
    'PageView',
  );
}

export function trackViewItem(
  event: CommerceEvent,
) {
  initializeTracking();

  window.gtag?.(
    'event',
    'view_item',
    googleCommerce(event),
  );

  window.fbq?.(
    'track',
    'ViewContent',
    metaCommerce(event),
  );
}

export function trackAddToCart(
  event: CommerceEvent,
) {
  initializeTracking();

  window.gtag?.(
    'event',
    'add_to_cart',
    googleCommerce(event),
  );

  window.fbq?.(
    'track',
    'AddToCart',
    metaCommerce(event),
  );
}

export function trackBeginCheckout(
  event: CommerceEvent,
) {
  initializeTracking();

  window.gtag?.(
    'event',
    'begin_checkout',
    googleCommerce(event),
  );

  window.fbq?.(
    'track',
    'InitiateCheckout',
    metaCommerce(event),
  );
}

export function trackOrderCreated(
  event: CommerceEvent,
) {
  initializeTracking();

  const google =
    googleCommerce(event);

  const meta =
    metaCommerce(event);

  window.gtag?.(
    'event',
    'order_created',
    google,
  );

  window.gtag?.(
    'event',
    'generate_lead',
    google,
  );

  window.fbq?.(
    'track',
    'Lead',
    meta,
    event.eventId
      ? {
          eventID:
            event.eventId,
        }
      : undefined,
  );

  sendGoogleAdsConversion(
    GOOGLE_ADS_ORDER_LABEL,
    google,
  );
}

export function trackPurchase(
  event: CommerceEvent,
) {
  initializeTracking();

  const google =
    googleCommerce(event);

  window.gtag?.(
    'event',
    'purchase',
    google,
  );

  window.fbq?.(
    'track',
    'Purchase',
    metaCommerce(event),
    event.eventId
      ? {
          eventID:
            event.eventId,
        }
      : undefined,
  );

  sendGoogleAdsConversion(
    GOOGLE_ADS_PURCHASE_LABEL,
    google,
  );
}

export function trackWhatsApp(
  params: GenericParams = {},
) {
  initializeTracking();

  window.gtag?.(
    'event',
    'contact_whatsapp',
    params,
  );

  window.fbq?.(
    'track',
    'Contact',
    params,
  );

  sendGoogleAdsConversion(
    GOOGLE_ADS_WHATSAPP_LABEL,
    params,
  );
}

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?:
    | 'website'
    | 'product';
  noIndex?: boolean;
};

function setMeta(
  selector: string,
  attribute:
    | 'name'
    | 'property',
  key: string,
  content: string,
) {
  let element =
    document.querySelector<
      HTMLMetaElement
    >(selector);

  if (!element) {
    element =
      document.createElement(
        'meta',
      );

    element.setAttribute(
      attribute,
      key,
    );

    document.head.appendChild(
      element,
    );
  }

  element.content = content;
}

export function setDocumentSeo({
  title,
  description,
  path,
  image,
  type = 'website',
  noIndex = false,
}: SeoInput) {
  document.title = title;

  setMeta(
    'meta[name="description"]',
    'name',
    'description',
    description,
  );

  setMeta(
    'meta[property="og:title"]',
    'property',
    'og:title',
    title,
  );

  setMeta(
    'meta[property="og:description"]',
    'property',
    'og:description',
    description,
  );

  setMeta(
    'meta[property="og:type"]',
    'property',
    'og:type',
    type,
  );

  setMeta(
    'meta[name="twitter:card"]',
    'name',
    'twitter:card',
    image
      ? 'summary_large_image'
      : 'summary',
  );

  setMeta(
    'meta[name="twitter:title"]',
    'name',
    'twitter:title',
    title,
  );

  setMeta(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    description,
  );

  setMeta(
    'meta[name="robots"]',
    'name',
    'robots',
    noIndex
      ? 'noindex,nofollow'
      : 'index,follow',
  );

  if (image) {
    setMeta(
      'meta[property="og:image"]',
      'property',
      'og:image',
      image,
    );

    setMeta(
      'meta[name="twitter:image"]',
      'name',
      'twitter:image',
      image,
    );
  }

  const canonicalUrl =
    new URL(
      path ??
        window.location.pathname,
      window.location.origin,
    ).toString();

  setMeta(
    'meta[property="og:url"]',
    'property',
    'og:url',
    canonicalUrl,
  );

  let canonical =
    document.querySelector<
      HTMLLinkElement
    >('link[rel="canonical"]');

  if (!canonical) {
    canonical =
      document.createElement(
        'link',
      );

    canonical.rel =
      'canonical';

    document.head.appendChild(
      canonical,
    );
  }

  canonical.href =
    canonicalUrl;
}
