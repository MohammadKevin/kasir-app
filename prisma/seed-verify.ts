import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting verification seeding...')

  // 1. Get or Create Admin
  let admin = await prisma.admin.findUnique({
    where: { email: 'ownercashier@gmail.com' },
  })

  if (!admin) {
    const hashedAdminPassword = await bcrypt.hash('ownercahsier2k26', 10)
    admin = await prisma.admin.create({
      data: {
        name: 'Owner Kasir',
        email: 'ownercashier@gmail.com',
        password: hashedAdminPassword,
      },
    })
    console.log('✅ Admin created')
  } else {
    console.log('ℹ️ Admin already exists:', admin.email)
  }

  // 2. Create Store
  const storeEmail = 'butiklaila@gmail.com'
  let store = await prisma.store.findUnique({
    where: { email: storeEmail },
  })

  if (!store) {
    const hashedStorePassword = await bcrypt.hash('butiklaila2k26', 10)
    store = await prisma.store.create({
      data: {
        adminId: admin.id,
        name: 'Butik Laila & Cafe',
        email: storeEmail,
        password: hashedStorePassword,
        phone: '08123456789',
        address: 'Jl. Sudirman No. 123, Jakarta',
        taxRate: 10, // 10%
        serviceRate: 5, // 5%
      },
    })
    console.log('✅ Store "Butik Laila & Cafe" created')
  } else {
    // Update store charges if exists
    store = await prisma.store.update({
      where: { id: store.id },
      data: {
        taxRate: 10,
        serviceRate: 5,
      }
    })
    console.log('ℹ️ Store already exists, updated rates')
  }

  // 3. Create Cashier User
  const cashierPin = '123456'
  const hashedPin = await bcrypt.hash(cashierPin, 10)
  
  let cashier = await prisma.user.findFirst({
    where: { storeId: store.id, name: 'Budi Kasir' }
  })

  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        adminId: admin.id,
        storeId: store.id,
        name: 'Budi Kasir',
        phone: '08111222333',
        pin: hashedPin,
        isActive: true,
      }
    })
    console.log('✅ Cashier "Budi Kasir" created with PIN "123456"')
  } else {
    console.log('ℹ️ Cashier already exists')
  }

  // 4. Create Tables
  const tableNumbers = ['01', '02', '03', '04', '05']
  for (const num of tableNumbers) {
    const capacity = num === '01' ? 2 : num === '05' ? 8 : 4
    await prisma.table.upsert({
      where: { storeId_number: { storeId: store.id, number: num } },
      update: { capacity },
      create: {
        storeId: store.id,
        number: num,
        capacity,
        status: 'AVAILABLE',
      }
    })
  }
  console.log('✅ Tables 01 to 05 created/updated')

  // 5. Create Category
  let category = await prisma.category.findFirst({
    where: { storeId: store.id, name: 'Makanan & Minuman' }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        storeId: store.id,
        name: 'Makanan & Minuman',
        description: 'Menu F&B Butik Laila & Cafe',
      }
    })
    console.log('✅ Category "Makanan & Minuman" created')
  }

  // 6. Create Ingredients
  const espressoIng = await prisma.ingredient.upsert({
    where: { id: 'espresso-ing-id-placeholder' }, // We can use findFirst/upsert structure
    update: { stock: 5000 },
    create: {
      id: 'espresso-ing-id-placeholder',
      storeId: store.id,
      name: 'Espresso',
      stock: 5000,
      unit: 'ml'
    }
  })

  const susuIng = await prisma.ingredient.upsert({
    where: { id: 'susu-ing-id-placeholder' },
    update: { stock: 10000 },
    create: {
      id: 'susu-ing-id-placeholder',
      storeId: store.id,
      name: 'Susu',
      stock: 10000,
      unit: 'ml'
    }
  })
  console.log('✅ Ingredients "Espresso" and "Susu" created/updated')

  // 7. Create Products
  const prodLatte = await prisma.product.upsert({
    where: { id: 'prod-latte-id-placeholder' },
    update: { stock: 100 },
    create: {
      id: 'prod-latte-id-placeholder',
      storeId: store.id,
      categoryId: category.id,
      name: 'Es Kopi Latte',
      costPrice: 10000,
      sellingPrice: 18000,
      stock: 100,
      sku: 'EKL-01',
      barcode: '888123456001',
      isActive: true
    }
  })

  const prodCroissant = await prisma.product.upsert({
    where: { id: 'prod-croissant-id-placeholder' },
    update: { stock: 50 },
    create: {
      id: 'prod-croissant-id-placeholder',
      storeId: store.id,
      categoryId: category.id,
      name: 'Croissant Chocolate',
      costPrice: 8000,
      sellingPrice: 15000,
      stock: 50,
      sku: 'CC-02',
      barcode: '888123456002',
      isActive: true
    }
  })
  console.log('✅ Products "Es Kopi Latte" and "Croissant Chocolate" created/updated')

  // 8. Create Recipe (ProductIngredient)
  await prisma.productIngredient.upsert({
    where: { productId_ingredientId: { productId: prodLatte.id, ingredientId: espressoIng.id } },
    update: { quantity: 10 },
    create: {
      productId: prodLatte.id,
      ingredientId: espressoIng.id,
      quantity: 10 // 10 ml
    }
  })

  await prisma.productIngredient.upsert({
    where: { productId_ingredientId: { productId: prodLatte.id, ingredientId: susuIng.id } },
    update: { quantity: 100 },
    create: {
      productId: prodLatte.id,
      ingredientId: susuIng.id,
      quantity: 100 // 100 ml
    }
  })
  console.log('✅ Recipe for "Es Kopi Latte" registered')

  // 9. Create Loyalty Customer
  const customerPhone = '089999999999'
  let customer = await prisma.customer.findFirst({
    where: { storeId: store.id, phone: customerPhone }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        storeId: store.id,
        name: 'Kevin Member',
        phone: customerPhone,
        points: 50,
        memberTier: 'SILVER',
        memberNumber: 'M-999999'
      }
    })
    console.log('✅ Loyalty member "Kevin Member" created with 50 points')
  } else {
    // Reset points for testing
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        points: 50,
        memberTier: 'SILVER'
      }
    })
    console.log('ℹ️ Customer already exists, points reset to 50')
  }

  console.log('🌱 Verification seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
