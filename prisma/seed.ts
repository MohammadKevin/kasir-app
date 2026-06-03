import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminName = process.env.OWNER_NAME
  const adminEmail = process.env.OWNER_EMAIL
  const adminPassword = process.env.OWNER_PASSWORD

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error(
      'OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD wajib diisi'
    )
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.admin.upsert({
    where: {
      email: adminEmail,
    },

    update: {},

    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
    },
  })

  console.log('✅ Admin seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })