import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  Send,
} from 'lucide-react';
import {
  useState,
  type FormEvent,
} from 'react';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';
import { useCompany } from '../context/CompanyContext';
import {
  getWhatsAppUrl,
  submitContactMessage,
} from '../lib/content';

export function ContactPage() {
  const { company } = useCompany();

  const [subject, setSubject] =
    useState('');

  const [name, setName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const whatsappUrl =
    getWhatsAppUrl(
      company?.whatsapp,
      'Bonjour GOI, je souhaite obtenir des informations.',
    );

  const latitude =
    company?.latitude === null ||
    company?.latitude === undefined
      ? null
      : Number(company.latitude);

  const longitude =
    company?.longitude === null ||
    company?.longitude ===
      undefined
      ? null
      : Number(company.longitude);

  const hasCoordinates =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const mapEmbedUrl =
    hasCoordinates
      ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
      : null;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      await submitContactMessage({
        subject: subject.trim(),
        name: name.trim(),
        phone: phone.trim(),
        email:
          email.trim() || null,
        message: message.trim(),
      });

      setSubject('');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible d’envoyer votre message.',
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="bg-goi-navy py-14 text-white">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <p className="font-bold uppercase tracking-[0.12em] text-goi-gold">
              Contact
            </p>

            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
              Contactez GOI
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Pour un produit, une commande,
              une installation ou une demande
              de devis.
            </p>
          </div>
        </section>

        <section className="bg-goi-ivory py-14">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              {(company?.address ||
                company?.city) && (
                <div className="rounded-2xl bg-white p-5">
                  <MapPin className="text-goi-blue" />

                  <p className="mt-3 font-bold text-goi-navy">
                    Adresse
                  </p>

                  <p className="mt-1 text-goi-muted">
                    {[
                      company?.address,
                      company?.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              {company?.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="block rounded-2xl bg-white p-5"
                >
                  <Phone className="text-goi-blue" />

                  <p className="mt-3 font-bold text-goi-navy">
                    Téléphone
                  </p>

                  <p className="mt-1 text-goi-muted">
                    {company.phone}
                  </p>
                </a>
              )}

              {company?.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="block rounded-2xl bg-white p-5"
                >
                  <Mail className="text-goi-blue" />

                  <p className="mt-3 font-bold text-goi-navy">
                    Email
                  </p>

                  <p className="mt-1 break-all text-goi-muted">
                    {company.email}
                  </p>
                </a>
              )}

              {company?.hoursText && (
                <div className="rounded-2xl bg-white p-5">
                  <Clock3 className="text-goi-blue" />

                  <p className="mt-3 font-bold text-goi-navy">
                    Horaires
                  </p>

                  <p className="mt-1 whitespace-pre-line text-goi-muted">
                    {
                      company.hoursText
                    }
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {company?.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-goi-navy px-4 font-bold text-white"
                  >
                    <Phone size={17} />
                    Appeler
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-goi-gold px-4 font-bold text-goi-navy"
                  >
                    <MessageCircle
                      size={17}
                    />
                    WhatsApp
                  </a>
                )}

                {company?.mapsUrl && (
                  <a
                    href={
                      company.mapsUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8ded8] bg-white px-4 font-bold text-goi-navy"
                  >
                    <Route size={17} />
                    Itinéraire
                  </a>
                )}
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-extrabold text-goi-navy">
                Envoyer un message
              </h2>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-goi-danger"
                >
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-goi-navy">
                  Votre message a bien été
                  enregistré. GOI pourra le
                  traiter depuis son
                  administration.
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">
                    Sujet *
                  </span>

                  <input
                    required
                    maxLength={191}
                    value={subject}
                    onChange={(event) =>
                      setSubject(
                        event.target.value,
                      )
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#d8ded8] px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Nom *
                  </span>

                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#d8ded8] px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Téléphone *
                  </span>

                  <input
                    required
                    maxLength={32}
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#d8ded8] px-4"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">
                    Email
                  </span>

                  <input
                    type="email"
                    maxLength={191}
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#d8ded8] px-4"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">
                    Message *
                  </span>

                  <textarea
                    required
                    rows={7}
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[#d8ded8] p-4"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-goi-navy px-6 font-bold text-white disabled:opacity-50"
              >
                <Send size={18} />

                {isSending
                  ? 'Envoi...'
                  : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </section>

        {mapEmbedUrl && (
          <section className="bg-white py-14">
            <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
              <h2 className="mb-6 text-3xl font-extrabold text-goi-navy">
                Nous localiser
              </h2>

              <iframe
                title="Localisation Grossiste Ouaga International"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full rounded-2xl border-0"
              />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
