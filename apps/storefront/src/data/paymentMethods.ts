import type { PaymentMethod } from '@goi/types';

export const demoPaymentMethods: PaymentMethod[] = [
  {
    code: 'ORANGE_MONEY',
    name: 'Orange Money',
    description: 'Paiement Mobile Money avec Transaction ID et vérification GOI.',
    enabled: true,
    actionMode: 'MANUAL',
    verificationMode: 'MANUAL',
  },
  {
    code: 'MOOV_MONEY',
    name: 'Moov Money',
    description: 'Paiement Mobile Money avec Transaction ID et vérification GOI.',
    enabled: true,
    actionMode: 'MANUAL',
    verificationMode: 'MANUAL',
  },
  {
    code: 'WAVE',
    name: 'Wave',
    description: 'Mode manuel de démonstration en attendant la configuration officielle.',
    enabled: true,
    actionMode: 'MANUAL',
    verificationMode: 'MANUAL',
  },
  {
    code: 'CORIS_MONEY',
    name: 'Coris Money',
    description: 'Mode manuel de démonstration en attendant la configuration officielle.',
    enabled: true,
    actionMode: 'MANUAL',
    verificationMode: 'MANUAL',
  },
];
