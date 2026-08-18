import { Badge, Button, Card, PaymentStatusBadge } from '@goi/ui';

export function AdminFoundationPage() {
  return (
    <main className="min-h-screen bg-goi-surface">
      <header className="border-b border-slate-200 bg-goi-navy text-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <strong>GOI · Administration</strong>
          <Badge tone="info">Fondations</Badge>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-goi-blue">Phase 1</p>
            <h1 className="mt-2 text-3xl font-bold text-goi-navy">
              Backoffice prêt à être construit
            </h1>
            <p className="mt-2 max-w-2xl text-goi-muted">
              La structure visuelle, les tokens et les composants partagés sont branchés.
              L'authentification et les modules métier arrivent en Phase 2/3.
            </p>
          </div>
          <Button>Ajouter un produit</Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Produits visibles', '—'],
            ['Commandes nouvelles', '—'],
            ['Paiements à vérifier', '—'],
            ['Messages non lus', '—'],
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm font-medium text-goi-muted">{label}</p>
              <p className="mt-3 text-3xl font-extrabold text-goi-navy">{value}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-goi-navy">File de paiements</h2>
              <p className="mt-1 text-sm text-goi-muted">Prévisualisation du statut partagé.</p>
            </div>
            <PaymentStatusBadge status="VERIFYING" />
          </div>
        </Card>
      </div>
    </main>
  );
}
