import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type CategoryCardProps = {
  name: string;
  description: string | null;
  slug: string;
};

export function CategoryCard({
  name,
  description,
  slug,
}: CategoryCardProps) {
  return (
    <Link
      to={`/produits?categorie=${encodeURIComponent(slug)}`}
      className="group rounded-goi-lg border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-goi-blue/30 hover:shadow-goi-2"
    >
      <div className="mb-8 flex size-12 items-center justify-center rounded-goi-md bg-goi-blue/10 font-bold text-goi-blue">
        {name.charAt(0)}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-goi-navy">
            {name}
          </h3>

          <p className="mt-2 text-sm leading-6 text-goi-muted">
            {description ??
              'Découvrez les produits disponibles dans cette catégorie.'}
          </p>
        </div>

        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 text-goi-muted transition group-hover:text-goi-blue"
        />
      </div>
    </Link>
  );
}
