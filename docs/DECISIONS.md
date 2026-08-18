# Décisions techniques initiales

## ADR-001 — Monorepo npm workspaces

Choix : un seul dépôt avec `apps/*` et `packages/*`.

Raison : garder le projet lisible pour un développeur junior, partager les types/UI et éviter trois dépôts qui dérivent séparément.

## ADR-002 — React + Vite + TypeScript

Les deux interfaces utilisent React/Vite/TypeScript. Tailwind CSS fournit les utilitaires de style et les tokens GOI sont centralisés dans `packages/ui`.

## ADR-003 — API Express séparée

L'API reste une application Node/Express séparée afin de conserver une architecture compatible avec l'hébergement prévu et le projet de référence.

## ADR-004 — Paiement manuel d'abord, providers ensuite

Le MVP acceptera plusieurs moyens configurables. Pour Mobile Money, la validation sera manuelle avec Transaction ID. Une future API opérateur remplacera la vérification manuelle sans modifier le modèle général du checkout.
