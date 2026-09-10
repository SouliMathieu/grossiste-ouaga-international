import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getCompany,
  type CompanySettings,
} from '../lib/content';

type CompanyContextValue = {
  company: CompanySettings | null;
  isLoading: boolean;
};

const CompanyContext =
  createContext<CompanyContextValue>({
    company: null,
    isLoading: true,
  });

export function CompanyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [company, setCompany] =
    useState<CompanySettings | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const controller =
      new AbortController();

    getCompany(controller.signal)
      .then(setCompany)
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erreur chargement entreprise :',
          error,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!company?.faviconMedia?.secureUrl) {
      return;
    }

    let link =
      document.querySelector<HTMLLinkElement>(
        'link[rel="icon"]',
      );

    if (!link) {
      link =
        document.createElement('link');

      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href =
      company.faviconMedia.secureUrl;
  }, [company]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
