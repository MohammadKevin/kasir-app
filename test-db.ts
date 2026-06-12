import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      createdAt: true,
      status: true,
    }
  });
  console.log('ALL TRANSACTIONS:', JSON.stringify(transactions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
