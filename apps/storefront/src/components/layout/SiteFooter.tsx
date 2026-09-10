import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import {
  getWhatsAppUrl,
} from '../../lib/content';
import {
  getCategories,
  type CatalogCategory,
} from '../../lib/catalog';

export function SiteFooter() {
  const { company } = useCompany();

  const [categories, setCategories] =
    useState<CatalogCategory[]>([]);

  const whatsappUrl =
    getWhatsAppUrl(company?.whatsapp);

  useEffect(() => {
    const controller =
      new AbortController();

    getCategories(controller.signal)
      .then((data) =>
        setCategories(data.slice(0, 6)),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
        }
      });

    return () => controller.abort();
  }, []);

  const socialLinks = [
    {
      label: 'Facebook',
      href: company?.facebookUrl,
    },
    {
      label: 'Instagram',
      href: company?.instagramUrl,
    },
    {
      label: 'LinkedIn',
      href: company?.linkedinUrl,
    },
    {
      label: 'YouTube',
      href: company?.youtubeUrl,
    },
    {
      label: 'TikTok',
      href: company?.tiktokUrl,
    },
  ].filter(
    (
      item,
    ): item is {
      label: string;
      href: string;
    } => Boolean(item.href),
  );

  return (
    <footer className="bg-goi-navy text-white">
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              to="/"
              className="inline-flex"
            >
              {company?.logoMedia
                ?.secureUrl ? (
                <img
                  src={
                    company.logoMedia
                      .secureUrl
                  }
                  alt={
                    company.logoMedia
                      .alt ??
                    company.businessName
                  }
                  className="h-12 w-auto max-w-[180px] object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-3xl font-black">
                  GOI
                </span>
              )}
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Vente d’équipements solaires,
              électriques, électroniques et
              électroménagers, avec services
              d’installation solaire et
              électrique.
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {socialLinks.map(
                  (item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-goi-gold hover:text-white"
                    >
                      {item.label}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold">
              Navigation
            </h3>

            <nav className="mt-4 flex flex-col gap-3 text-sm text-white/70">
              <Link to="/">
                Accueil
              </Link>
              <Link to="/produits">
                Produits
              </Link>
              <Link to="/services">
                Services
              </Link>
              <Link to="/realisations">
                Nos Réalisations
              </Link>
              <Link to="/a-propos">
                À propos
              </Link>
              <Link to="/contact">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-bold">
              Nos univers
            </h3>

            <nav className="mt-4 flex flex-col gap-3 text-sm text-white/70">
              {categories.length > 0 ? (
                categories.map(
                  (category) => (
                    <Link
                      key={category.id}
                      to={`/produits?category=${encodeURIComponent(
                        category.slug,
                      )}`}
                    >
                      {category.name}
                    </Link>
                  ),
                )
              ) : (
                <>
                  <span>
                    Énergie solaire
                  </span>
                  <span>
                    Électricité
                  </span>
                  <span>
                    Électronique
                  </span>
                  <span>
                    Électroménager
                  </span>
                </>
              )}
            </nav>
          </div>

          <div>
            <h3 className="font-bold">
              Contact
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              {(company?.address ||
                company?.city) && (
                <div className="flex gap-2">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-goi-gold"
                  />

                  {company?.mapsUrl ? (
                    <a
                      href={
                        company.mapsUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {[
                        company.address,
                        company.city,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </a>
                  ) : (
                    <span>
                      {[
                        company?.address,
                        company?.city,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                </div>
              )}

              {company?.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex gap-2"
                >
                  <Phone
                    size={17}
                    className="text-goi-gold"
                  />
                  {company.phone}
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-2"
                >
                  <MessageCircle
                    size={17}
                    className="text-goi-gold"
                  />
                  WhatsApp
                </a>
              )}

              {company?.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex gap-2 break-all"
                >
                  <Mail
                    size={17}
                    className="shrink-0 text-goi-gold"
                  />
                  {company.email}
                </a>
              )}

              {company?.hoursText && (
                <div className="flex gap-2">
                  <Clock3
                    size={17}
                    className="shrink-0 text-goi-gold"
                  />
                  {company.hoursText}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()}{' '}
            {company?.businessName ??
              'Grossiste Ouaga International'}.
          </p>

          <p>
            Catalogue, commandes et demandes
            de devis.
          </p>
        </div>
      </div>
    </footer>
  );
}
