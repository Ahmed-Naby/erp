"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/rbac"
import { periodLockSchema } from "@/lib/validations/accounting"

export async function lockPeriod(input: unknown) {
  await requireAdmin()
  const data = periodLockSchema.parse(input)
  await prisma.periodLock.upsert({
    where: { period: data.period },
    create: { period: data.period, note: data.note || null },
    update: { note: data.note || null },
  })
  revalidatePath("/accounting/periods")
}

export async function unlockPeriod(id: string) {
  await requireAdmin()
  await prisma.periodLock.delete({ where: { id } })
  revalidatePath("/accounting/periods")
}
