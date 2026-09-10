import { useEffect } from 'react';
import {
  useLocation,
} from 'react-router-dom';
import {
  setDocumentSeo,
  trackPageView,
  trackWhatsApp,
} from '../../lib/marketing/tracking';

const DEFAULT_DESCRIPTION =
  'Grossiste Ouaga International — produits solaires, électriques, électroniques et électroménagers à Ouagadougou.';

function getSeo(pathname: string) {
  if (pathname === '/') {
    return {
      title:
        'Grossiste Ouaga International | Ouagadougou',
      description:
        DEFAULT_DESCRIPTION,
    };
  }

  if (
    pathname === '/produits'
  ) {
    return {
      title:
        'Produits | Grossiste Ouaga International',
      description:
        'Découvrez le catalogue de produits de Grossiste Ouaga International.',
    };
  }

  if (
    pathname.startsWith(
      '/produits/',
    )
  ) {
    return {
      title:
        'Produit | Grossiste Ouaga International',
      description:
        'Découvrez ce produit proposé par Grossiste Ouaga International.',
      type:
        'product' as const,
    };
  }

  if (
    pathname === '/services' ||
    pathname.startsWith(
      '/services/',
    )
  ) {
    return {
      title:
        'Services | Grossiste Ouaga International',
      description:
        'Découvrez les services proposés par Grossiste Ouaga International.',
    };
  }

  if (
    pathname ===
      '/realisations' ||
    pathname.startsWith(
      '/realisations/',
    )
  ) {
    return {
      title:
        'Nos réalisations | Grossiste Ouaga International',
      description:
        'Découvrez les réalisations de Grossiste Ouaga International.',
    };
  }

  if (
    pathname === '/a-propos'
  ) {
    return {
      title:
        'À propos | Grossiste Ouaga International',
      description:
        'Découvrez Grossiste Ouaga International et son activité à Ouagadougou.',
    };
  }

  if (
    pathname === '/contact'
  ) {
    return {
      title:
        'Contact | Grossiste Ouaga International',
      description:
        'Contactez Grossiste Ouaga International à Ouagadougou.',
    };
  }

  if (
    pathname === '/panier'
  ) {
    return {
      title:
        'Panier | Grossiste Ouaga International',
      description:
        'Consultez votre panier GOI.',
      noIndex: true,
    };
  }

  if (
    pathname.startsWith(
      '/commande',
    )
  ) {
    return {
      title:
        'Commande | Grossiste Ouaga International',
      description:
        'Finalisez votre commande GOI.',
      noIndex: true,
    };
  }

  return {
    title:
      'Grossiste Ouaga International',
    description:
      DEFAULT_DESCRIPTION,
  };
}

export function MarketingTracking() {
  const location = useLocation();

  useEffect(() => {
    const seo =
      getSeo(location.pathname);

    setDocumentSeo({
      ...seo,
      path: location.pathname,
    });

    trackPageView(
      `${location.pathname}${location.search}`,
    );
  }, [
    location.pathname,
    location.search,
  ]);

  useEffect(() => {
    function handleClick(
      event: MouseEvent,
    ) {
      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const link =
        target.closest<HTMLAnchorElement>(
          'a[href]',
        );

      if (!link) {
        return;
      }

      const href =
        link.href.toLowerCase();

      if (
        href.includes(
          'wa.me/',
        ) ||
        href.includes(
          'whatsapp.com/',
        )
      ) {
        trackWhatsApp({
          page_path:
            window.location.pathname,
        });
      }
    }

    document.addEventListener(
      'click',
      handleClick,
    );

    return () => {
      document.removeEventListener(
        'click',
        handleClick,
      );
    };
  }, []);

  return null;
}
