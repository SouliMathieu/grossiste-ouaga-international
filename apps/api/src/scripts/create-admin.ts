import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const inputSchema = z.object({
  email: z.string().trim().email().max(191),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(128),
});

async function main() {
  const parsed = inputSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    fullName: process.env.ADMIN_FULL_NAME,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_FULL_NAME et un mot de passe d’au moins 12 caractères sont requis.',
    );
  }

  const email = parsed.data.email.toLowerCase();

  const passwordHash = await bcrypt.hash(
    parsed.data.password,
    12,
  );

  const admin = await prisma.adminUser.upsert({
    where: {
      email,
    },
    update: {
      fullName: parsed.data.fullName,
      passwordHash,
      active: true,
      role: 'SUPER_ADMIN',
    },
    create: {
      email,
      fullName: parsed.data.fullName,
      passwordHash,
      active: true,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Administrateur prêt : ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
