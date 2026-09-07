import {
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import {
  useState,
  type FormEvent,
} from 'react';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-goi-surface">
          <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 sm:py-18">
            <p className="font-semibold text-goi-blue">
              Contact
            </p>

            <h1 className="mt-2 max-w-3xl text-4xl font-extrabold tracking-tight text-goi-navy sm:text-5xl">
              Parlons de votre besoin.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-goi-muted">
              Une question sur un produit, une quantité importante
              ou une demande professionnelle ? Préparez votre
              demande ici.
            </p>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-18">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="space-y-4">
              <div className="rounded-goi-lg border border-slate-200 bg-goi-surface p-6">
                <div className="flex size-11 items-center justify-center rounded-goi-md bg-white text-goi-blue">
                  <Building2 size={21} />
                </div>

                <h2 className="mt-4 font-bold text-goi-navy">
                  Grossiste Ouaga International
                </h2>

                <p className="mt-2 text-sm leading-6 text-goi-muted">
                  Commerce & distribution.
                </p>
              </div>

              <div className="rounded-goi-lg border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <MapPin
                    className="mt-0.5 shrink-0 text-goi-blue"
                    size={21}
                  />

                  <div>
                    <h3 className="font-bold text-goi-navy">
                      Localisation
                    </h3>
                    <p className="mt-1 text-sm text-goi-muted">
                      Ouagadougou, Burkina Faso
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-goi-lg border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <Phone
                    className="mt-0.5 shrink-0 text-goi-blue"
                    size={21}
                  />

                  <div>
                    <h3 className="font-bold text-goi-navy">
                      Téléphone
                    </h3>
                    <p className="mt-1 text-sm text-goi-muted">
                      Coordonnée officielle à renseigner.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-goi-lg border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <MessageCircle
                    className="mt-0.5 shrink-0 text-goi-blue"
                    size={21}
                  />

                  <div>
                    <h3 className="font-bold text-goi-navy">
                      WhatsApp
                    </h3>
                    <p className="mt-1 text-sm text-goi-muted">
                      Canal officiel à connecter avant lancement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-goi-lg border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <Mail
                    className="mt-0.5 shrink-0 text-goi-blue"
                    size={21}
                  />

                  <div>
                    <h3 className="font-bold text-goi-navy">
                      Email
                    </h3>
                    <p className="mt-1 text-sm text-goi-muted">
                      Adresse officielle à renseigner.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="rounded-goi-lg border border-slate-200 bg-white p-6 shadow-goi-1 sm:p-8">
              <p className="font-semibold text-goi-blue">
                Demande de contact
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-goi-navy">
                Décrivez votre besoin
              </h2>

              {submitted ? (
                <div className="mt-7 rounded-goi-md border border-blue-200 bg-blue-50 p-5">
                  <h3 className="font-bold text-goi-navy">
                    Formulaire prêt pour l’intégration.
                  </h3>

                  <p className="mt-2 leading-6 text-goi-muted">
                    Le formulaire est actuellement disponible pour préparer
                    votre demande. Le canal de transmission officiel
                    GOI sera activé avec les coordonnées commerciales
                    définitives.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 font-semibold text-goi-blue"
                  >
                    Modifier la demande
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-7 grid gap-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-goi-navy">
                        Nom complet *
                      </span>
                      <input
                        required
                        name="name"
                        autoComplete="name"
                        className="min-h-12 rounded-goi-md border border-slate-300 px-4 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-goi-navy">
                        Téléphone *
                      </span>
                      <input
                        required
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className="min-h-12 rounded-goi-md border border-slate-300 px-4 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-goi-navy">
                      Email
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="min-h-12 rounded-goi-md border border-slate-300 px-4 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-goi-navy">
                      Objet *
                    </span>
                    <select
                      required
                      name="subject"
                      defaultValue=""
                      className="min-h-12 rounded-goi-md border border-slate-300 bg-white px-4 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                    >
                      <option value="" disabled>
                        Choisir un sujet
                      </option>
                      <option value="product">
                        Information produit
                      </option>
                      <option value="quote">
                        Demande de devis / quantité
                      </option>
                      <option value="order">
                        Suivi d’une commande
                      </option>
                      <option value="other">
                        Autre demande
                      </option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-goi-navy">
                      Message *
                    </span>
                    <textarea
                      required
                      name="message"
                      rows={6}
                      className="resize-y rounded-goi-md border border-slate-300 px-4 py-3 outline-none focus:border-goi-blue focus:ring-2 focus:ring-goi-blue/15"
                      placeholder="Précisez les produits, quantités ou informations dont vous avez besoin."
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-fit items-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Préparer ma demande
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
