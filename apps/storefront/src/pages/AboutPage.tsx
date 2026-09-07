import {
  ArrowRight,
  BadgeCheck,
  Building2,
  PackageCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { TopBar } from '../components/layout/TopBar';

const commitments = [
  {
    icon: PackageCheck,
    title: 'Une offre structurée',
    text: 'Des produits organisés par catégorie, référence, prix, conditionnement et disponibilité.',
  },
  {
    icon: Users,
    title: 'B2C & B2B',
    text: 'Une expérience adaptée aux particuliers, revendeurs, entreprises et acheteurs professionnels.',
  },
  {
    icon: BadgeCheck,
    title: 'Information claire',
    text: 'Aucune promesse commerciale ou disponibilité ne doit être affichée sans information confirmée.',
  },
];

export function AboutPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />

      <main>
        <section className="bg-goi-navy text-white">
          <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="font-semibold text-goi-gold">
                À propos de GOI
              </p>

              <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
                Commerce et distribution, avec une expérience
                pensée pour être claire et efficace.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Grossiste Ouaga International développe une
                expérience de catalogue et de commande destinée à
                faciliter l’accès à son offre à Ouagadougou.
              </p>
            </div>

            <div className="rounded-goi-lg border border-white/10 bg-white/5 p-7 sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-gold text-goi-navy">
                <Building2 size={24} />
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                Grossiste Ouaga International
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                Une plateforme conçue pour présenter le catalogue,
                préparer une commande, choisir un moyen de paiement
                et faciliter le traitement commercial.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="font-semibold text-goi-blue">
                  Notre mission
                </p>

                <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
                  Simplifier la recherche et la commande de
                  produits.
                </h2>
              </div>

              <div className="space-y-5 text-base leading-8 text-goi-muted">
                <p>
                  L’objectif de GOI est de proposer une expérience
                  commerciale structurée : trouver un produit,
                  comprendre son conditionnement, connaître son prix
                  et préparer une commande sans friction inutile.
                </p>

                <p>
                  La plateforme est également pensée pour les besoins
                  des professionnels qui souhaitent commander en
                  quantité ou demander un traitement commercial
                  adapté.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-goi-surface py-16 sm:py-20">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
            <p className="font-semibold text-goi-blue">
              Nos engagements
            </p>

            <h2 className="mt-2 max-w-3xl text-3xl font-extrabold text-goi-navy">
              Une expérience fondée sur la clarté et la confiance.
            </h2>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {commitments.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-goi-lg border border-slate-200 bg-white p-7"
                >
                  <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 text-goi-blue">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-goi-navy">
                    {title}
                  </h3>

                  <p className="mt-3 leading-7 text-goi-muted">
                    {text}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/produits"
                className="inline-flex min-h-12 items-center gap-2 rounded-goi-md bg-goi-blue px-6 font-semibold text-white hover:bg-blue-700"
              >
                Découvrir le catalogue
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex min-h-12 items-center rounded-goi-md border border-slate-300 bg-white px-6 font-semibold text-goi-navy hover:bg-goi-surface"
              >
                Contacter GOI
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
