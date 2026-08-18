# Architecture GOI — v0.1

## Applications

- `apps/storefront` : catalogue et e-commerce public.
- `apps/admin` : backoffice protégé.
- `apps/api` : API REST et logique métier.

## Packages

- `packages/ui` : design tokens et composants UI réutilisables.
- `packages/types` : types partagés entre storefront, admin et API.

## Principes

1. Storefront et backoffice ne parlent jamais directement à MySQL.
2. Toute règle métier importante est validée côté API.
3. Les paiements utilisent une abstraction `PaymentService/provider` à partir de la Phase 2.
4. Le paiement Mobile Money MVP reste manuel : création commande → paiement externe → Transaction ID → vérification admin.
5. Les deep links/USSD ne sont activés qu'après vérification officielle et test sur appareils réels.
