import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  console.log('CATEGORIES:', categories);
  const gamis = categories.find(c => c.name.toLowerCase() === 'gamis');
  if (gamis) {
    const products = await prisma.product.findMany({
      where: { categoryId: gamis.id },
      select: { id: true, name: true, sellingPrice: true, stock: true, sku: true }
    });
    console.log('GAMIS PRODUCTS:', products);
  } else {
    console.log('GAMIS category not found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
