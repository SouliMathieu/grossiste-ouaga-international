# Grossiste Ouaga International (GOI)

Socle technique du site e-commerce GOI : storefront public, backoffice, API et packages partagés.

## Phase actuelle

**Phase 1 — Fondations techniques & design system.**

Le dépôt contient volontairement des données de démonstration et aucun compte de paiement réel. Les moyens de paiement sont simulés dans l'interface tant que les comptes/numéros GOI ne sont pas confirmés.

## Prérequis

- Node.js 22.12+ recommandé
- npm 10+
- MySQL sera requis à partir de la Phase 2

## Installation

```bash
npm install
```

Après la première installation réussie, **commiter `package-lock.json`** afin de figer les versions réellement résolues.

## Développement

Ouvrir trois terminaux :

```bash
npm run dev:storefront
npm run dev:admin
npm run dev:api
```

Ports prévus :

- Storefront : `http://localhost:5173`
- Backoffice : `http://localhost:5174`
- API : `http://localhost:4000`

## Vérifications

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Structure

```text
apps/
  storefront/   # React + Vite + TypeScript + Tailwind
  admin/        # React + Vite + TypeScript + Tailwind
  api/          # Node + Express + TypeScript
packages/
  ui/           # tokens et primitives UI partagées
  types/        # types métier partagés
docs/           # décisions et conventions projet
```

## Règles importantes

- Aucune commande Mobile Money ne devient `PAID` côté client.
- Un `Transaction ID` soumis passe d'abord par `SUBMITTED/VERIFYING`.
- Les informations de paiement seront servies par l'API, jamais codées en dur dans le storefront de production.
- Le couple `provider + transactionId` devra être unique en base en Phase 2.
- Aucun PIN, mot de passe ou secret Mobile Money ne sera collecté.
