import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma =
  new PrismaClient()

async function main() {
  const adminName =
    process.env.OWNER_NAME

  const adminEmail =
    process.env.OWNER_EMAIL

  const adminPassword =
    process.env.OWNER_PASSWORD

  if (
    !adminName ||
    !adminEmail ||
    !adminPassword
  ) {
    throw new Error(
      'OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD wajib diisi',
    )
  }

  const exist =
    await prisma.admin.findUnique({
      where: {
        email:
          adminEmail,
      },
    })

  if (exist) {
    console.log(
      'ℹ️ Admin sudah ada',
    )

    return
  }

  const hashedPassword =
    await bcrypt.hash(
      adminPassword,
      10,
    )

  await prisma.admin.create({
    data: {
      name:
        adminName,

      email:
        adminEmail,

      password:
        hashedPassword,
    },
  })

  console.log(
    '✅ Admin seeded',
  )
}

main()
  .catch(
    (
      e,
    ) => {
      console.error(
        e,
      )

      process.exit(
        1,
      )
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    },
  )