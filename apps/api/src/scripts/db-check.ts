import { prisma } from '../lib/prisma.js';

async function main() {
  const result = await prisma.$queryRaw<Array<{ database_name: string }>>`
    SELECT DATABASE() AS database_name
  `;

  const orders = await prisma.order.count();
  const orderItems = await prisma.orderItem.count();

  console.log('Connexion MySQL réussie');
  console.log('Base :', result[0]?.database_name);
  console.log('Commandes :', orders);
  console.log('Lignes de commande :', orderItems);
}

main()
  .catch((error) => {
    console.error('Erreur de connexion Prisma :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
