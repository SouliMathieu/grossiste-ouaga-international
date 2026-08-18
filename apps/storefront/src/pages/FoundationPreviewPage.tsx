import { useState } from 'react';
import type { PaymentMethod, PaymentProviderCode } from '@goi/types';
import {
  Badge,
  Button,
  Card,
  CopyField,
  Input,
  PaymentMethodCard,
  PaymentStatusBadge,
} from '@goi/ui';
import { demoPaymentMethods } from '../data/paymentMethods';

export function FoundationPreviewPage() {
  const [selected, setSelected] = useState<PaymentProviderCode>('ORANGE_MONEY');

  const current: PaymentMethod =
    demoPaymentMethods.find((method) => method.code === selected) ?? demoPaymentMethods[0]!;

  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a className="font-extrabold tracking-tight text-goi-navy" href="/">
            GOI
          </a>
          <Badge tone="info">Phase 1 · Fondations</Badge>
        </div>
      </header>

      <section className="bg-goi-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <Badge tone="warning">Grossiste Ouaga International</Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Une base e-commerce claire, rapide et prête à évoluer.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Cette page est le premier prototype technique : palette GOI, primitives UI et parcours
              de paiement multi-moyens en démonstration.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button>Voir les composants</Button>
              <Button variant="secondary">Consulter le catalogue</Button>
            </div>
          </div>

          <Card className="self-start text-goi-slate shadow-goi-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-goi-muted">
                  État paiement de démonstration
                </p>
                <p className="mt-1 text-2xl font-extrabold text-goi-navy">75 000 FCFA</p>
              </div>
              <PaymentStatusBadge status="VERIFYING" />
            </div>
            <div className="mt-5 grid gap-3">
              <CopyField label="Référence" value="GOI-2026-000001" />
              <CopyField label="Transaction ID" value="DEMO-TX-001" />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-goi-blue">Primitives</p>
            <h2 className="mt-2 text-3xl font-bold text-goi-navy">Composants de base</h2>
            <div className="mt-6 grid gap-5">
              <Input
                label="Recherche"
                placeholder="Rechercher un produit, une marque, une référence…"
              />
              <div className="flex flex-wrap gap-3">
                <Button>Action principale</Button>
                <Button variant="secondary">Secondaire</Button>
                <Button variant="ghost">Discret</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-goi-blue">Paiement MVP</p>
            <h2 className="mt-2 text-3xl font-bold text-goi-navy">Choix multi-moyens</h2>
            <p className="mt-3 text-sm leading-6 text-goi-muted">
              Données de démonstration uniquement. Aucun compte marchand réel n'est présent dans le
              code.
            </p>
            <div className="mt-6 grid gap-3">
              {demoPaymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.code}
                  method={method}
                  selected={method.code === current.code}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
