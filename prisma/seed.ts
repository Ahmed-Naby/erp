import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEFAULT_ACCOUNTS } from "../src/lib/accounts"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@erp.local"
  const passwordHash = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  })

  console.log(`Seeded admin user: ${admin.email} (password: admin123)`)

  const staffEmail = "staff@erp.local"
  const staffPasswordHash = await bcrypt.hash("staff123", 10)

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      name: "Staff",
      email: staffEmail,
      passwordHash: staffPasswordHash,
      role: "STAFF",
    },
  })

  console.log(`Seeded staff user: ${staff.email} (password: staff123)`)

  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    })
  }

  console.log(`Seeded ${DEFAULT_ACCOUNTS.length} default accounts`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
