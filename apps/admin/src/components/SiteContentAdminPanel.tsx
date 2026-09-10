import {
  BriefcaseBusiness,
  Home,
  Images,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { HomeContentAdminPanel } from './HomeContentAdminPanel';
import { AboutContentAdminPanel } from './AboutContentAdminPanel';
import { RealizationsContentAdminPanel } from './RealizationsContentAdminPanel';
import { ServicesContentAdminPanel } from './ServicesContentAdminPanel';

type Section =
  | 'home'
  | 'services'
  | 'realizations'
  | 'about';

const sections = [
  {
    id: 'home' as const,
    label: 'Accueil',
    icon: Home,
  },
  {
    id: 'services' as const,
    label: 'Services',
    icon: BriefcaseBusiness,
  },
  {
    id: 'realizations' as const,
    label: 'Réalisations',
    icon: Images,
  },
  {
    id: 'about' as const,
    label: 'À propos',
    icon: Info,
  },
];

export function SiteContentAdminPanel() {
  const [section, setSection] =
    useState<Section>('home');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map(
          ({
            id,
            label,
            icon: Icon,
          }) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setSection(id)
              }
              className={[
                'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold',
                section === id
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600',
              ].join(' ')}
            >
              <Icon size={17} />
              {label}
            </button>
          ),
        )}
      </div>

      {section === 'home' && (
        <HomeContentAdminPanel />
      )}

      {section === 'services' && (
        <ServicesContentAdminPanel />
      )}

      {section === 'realizations' && (
        <RealizationsContentAdminPanel />
      )}

      {section === 'about' && (
        <AboutContentAdminPanel />
      )}
    </div>
  );
}
