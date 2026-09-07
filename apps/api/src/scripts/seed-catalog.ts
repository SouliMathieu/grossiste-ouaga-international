import { prisma } from '../lib/prisma.js';

async function main() {
  const categories = [
    {
      id: 1,
      name: 'Énergie solaire',
      slug: 'energie-solaire',
      description: 'Panneaux solaires et solutions de production solaire.',
      sortOrder: 10,
    },
    {
      id: 2,
      name: 'Batteries & stockage',
      slug: 'batteries-stockage',
      description: 'Solutions de stockage et batteries pour installations.',
      sortOrder: 20,
    },
    {
      id: 3,
      name: 'Onduleurs & régulation',
      slug: 'onduleurs-regulation',
      description: 'Onduleurs, convertisseurs et équipements de régulation.',
      sortOrder: 30,
    },
    {
      id: 4,
      name: 'Électronique & éclairage',
      slug: 'electronique-eclairage',
      description: 'Équipements électroniques et solutions d’éclairage.',
      sortOrder: 40,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: {
        ...category,
        active: true,
      },
    });
  }

  const products = [
    {
      id: 1,
      categoryId: 1,
      sku: 'GOI-DEMO-001',
      slug: 'panneau-solaire-200w-demo',
      name: 'Panneau solaire 200 W — Démo',
      shortDescription:
        'Produit de recette pour valider le catalogue et le parcours de commande.',
      description:
        'Produit de démonstration. Les caractéristiques commerciales définitives seront renseignées depuis le backoffice.',
      price: 12500,
      unit: 'pièce',
      minOrderQty: 1,
      packSize: 1,
      featured: true,
      keywords: 'solaire panneau énergie',
    },
    {
      id: 2,
      categoryId: 2,
      sku: 'GOI-DEMO-002',
      slug: 'batterie-solaire-demo',
      name: 'Batterie solaire — Démo',
      shortDescription:
        'Produit de recette pour les tests de stockage et de commande.',
      description:
        'Produit de démonstration. Capacité, technologie et garantie seront confirmées par GOI.',
      price: 28000,
      unit: 'carton',
      minOrderQty: 1,
      packSize: 1,
      featured: true,
      keywords: 'batterie stockage solaire énergie',
    },
    {
      id: 3,
      categoryId: 3,
      sku: 'GOI-DEMO-003',
      slug: 'onduleur-solaire-demo',
      name: 'Onduleur solaire — Démo',
      shortDescription:
        'Produit de recette pour tester catalogue, panier et paiement.',
      description:
        'Produit de démonstration. Puissance et caractéristiques définitives seront renseignées ultérieurement.',
      price: 45000,
      unit: 'pièce',
      minOrderQty: 1,
      packSize: 1,
      featured: true,
      keywords: 'onduleur convertisseur solaire',
    },
    {
      id: 4,
      categoryId: 4,
      sku: 'GOI-DEMO-004',
      slug: 'kit-eclairage-led-solaire-demo',
      name: 'Kit éclairage LED solaire — Démo',
      shortDescription:
        'Kit de recette pour tester les produits électroniques et solaires.',
      description:
        'Produit de démonstration. Contenu du kit et spécifications à confirmer avec GOI.',
      price: 18500,
      unit: 'pack',
      minOrderQty: 1,
      packSize: 1,
      featured: false,
      keywords: 'led éclairage solaire kit',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        sku: product.sku,
      },
      update: {
        categoryId: product.categoryId,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        currency: 'XOF',
        unit: product.unit,
        minOrderQty: product.minOrderQty,
        packSize: product.packSize,
        availability: 'IN_STOCK',
        featured: product.featured,
        status: 'PUBLISHED',
        keywords: product.keywords,
      },
      create: {
        id: product.id,
        categoryId: product.categoryId,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        currency: 'XOF',
        unit: product.unit,
        minOrderQty: product.minOrderQty,
        packSize: product.packSize,
        availability: 'IN_STOCK',
        featured: product.featured,
        status: 'PUBLISHED',
        keywords: product.keywords,
      },
    });
  }

  console.log('Catalogue de démonstration prêt.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
