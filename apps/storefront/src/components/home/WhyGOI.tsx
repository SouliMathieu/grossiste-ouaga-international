import { BadgeCheck, Headphones, PackageCheck, Truck } from 'lucide-react';

const advantages = [
  {
    icon: PackageCheck,
    title: 'Catalogue structuré',
    text: 'Des produits organisés par catégories pour trouver rapidement ce dont vous avez besoin.',
  },
  {
    icon: Truck,
    title: 'Commande simplifiée',
    text: 'Préparez votre panier et choisissez votre mode de livraison ou de retrait.',
  },
  {
    icon: Headphones,
    title: 'Assistance disponible',
    text: 'GOI reste joignable pour accompagner les particuliers, revendeurs et entreprises.',
  },
  {
    icon: BadgeCheck,
    title: 'Expérience professionnelle',
    text: 'Prix, conditionnement, disponibilité et références clairement présentés.',
  },
];

export function WhyGOI() {
  return (
    <section className="bg-goi-surface py-16 sm:py-20">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-semibold text-goi-blue">Pourquoi GOI ?</p>

          <h2 className="mt-2 text-3xl font-extrabold text-goi-navy">
            Une expérience pensée pour acheter plus simplement
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-goi-lg border border-slate-200 bg-white p-6"
            >
              <div className="flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 text-goi-blue">
                <Icon size={22} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-goi-navy">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-goi-muted">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
