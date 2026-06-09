import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trx = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
        }
      }
    }
  });
  console.log('LATEST TRANSACTION:', JSON.stringify(trx, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
