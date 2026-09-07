import { prisma } from '../lib/prisma.js';

const paymentMethods = [
  {
    code: 'ORANGE_MONEY',
    name: 'Orange Money',
    type: 'MOBILE_MONEY' as const,
    sortOrder: 10,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement Orange Money à validation manuelle.',
  },
  {
    code: 'MOOV_MONEY',
    name: 'Moov Money',
    type: 'MOBILE_MONEY' as const,
    sortOrder: 20,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement Moov Money à validation manuelle.',
  },
  {
    code: 'WAVE',
    name: 'Wave',
    type: 'MOBILE_MONEY' as const,
    sortOrder: 30,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement Wave à validation manuelle.',
  },
  {
    code: 'CORIS_MONEY',
    name: 'Coris Money',
    type: 'MOBILE_MONEY' as const,
    sortOrder: 40,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement Coris Money à validation manuelle.',
  },
  {
    code: 'CASH_DELIVERY',
    name: 'Paiement à la livraison',
    type: 'CASH' as const,
    sortOrder: 50,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement lors de la livraison de la commande.',
  },
  {
    code: 'CASH_PICKUP',
    name: 'Paiement au retrait',
    type: 'CASH' as const,
    sortOrder: 60,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Paiement lors du retrait de la commande.',
  },
  {
    code: 'BANK_TRANSFER',
    name: 'Virement bancaire',
    type: 'BANK_TRANSFER' as const,
    sortOrder: 70,
    verificationMode: 'MANUAL',
    actionMode: 'MANUAL',
    instructions: 'Virement bancaire à validation manuelle.',
  },
];

async function main() {
  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: {
        code: method.code,
      },
      update: {
        name: method.name,
        type: method.type,
        sortOrder: method.sortOrder,
        verificationMode: method.verificationMode,
        actionMode: method.actionMode,
        instructions: method.instructions,
      },
      create: {
        ...method,
        enabled: true,
      },
    });

    console.log(`Moyen de paiement prêt : ${method.code}`);
  }
}

main()
  .catch((error) => {
    console.error('Erreur seed moyens de paiement :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
