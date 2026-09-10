import {
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { getWhatsAppUrl } from '../../lib/content';

export function TopBar() {
  const { company } = useCompany();

  const whatsappUrl =
    getWhatsAppUrl(company?.whatsapp);

  const hasContent =
    company?.city ||
    company?.phone ||
    company?.hoursText ||
    whatsappUrl;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="bg-goi-navy text-white">
      <div className="mx-auto flex min-h-9 max-w-[1360px] items-center justify-between gap-4 px-4 text-xs sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {company?.city && (
            <span className="flex items-center gap-1.5">
              <MapPin
                size={13}
                className="shrink-0 text-goi-gold"
              />
              {company.city}
            </span>
          )}

          {company?.phone && (
            <a
              href={`tel:${company.phone}`}
              className="hidden items-center gap-1.5 hover:text-goi-gold sm:flex"
            >
              <Phone size={13} />
              {company.phone}
            </a>
          )}

          {company?.hoursText && (
            <span className="hidden items-center gap-1.5 text-white/75 lg:flex">
              <Clock3 size={13} />
              {company.hoursText}
            </span>
          )}
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 font-semibold text-goi-gold hover:text-white"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
