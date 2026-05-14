require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const SUPER_ADMIN_NAME =
    process.env.SUPER_ADMIN_NAME;

  const SUPER_ADMIN_EMAIL =
    process.env.SUPER_ADMIN_EMAIL;

  const SUPER_ADMIN_PASSWORD =
    process.env.SUPER_ADMIN_PASSWORD;

  const hashedPassword =
    await bcrypt.hash(
      SUPER_ADMIN_PASSWORD,
      10,
    );

  await prisma.user.upsert({
    where: {
      email: SUPER_ADMIN_EMAIL,
    },

    update: {},

    create: {
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(
    '✅ Super Admin Created',
  );

  console.log(
    '🎉 Seeding Finished',
  );
}

main()
  .catch((e) => {
    console.error(
      '❌ Seed Error:',
      e,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });