"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { shareholderSchema, shareHoldingSchema } from "@/lib/validations/equity"

export async function createShareholder(input: unknown) {
  const data = shareholderSchema.parse(input)
  await prisma.shareholder.create({
    data: { name: data.name, email: data.email || null, type: data.type },
  })
  revalidatePath("/equity/shareholders")
}

export async function updateShareholder(id: string, input: unknown) {
  const data = shareholderSchema.parse(input)
  await prisma.shareholder.update({
    where: { id },
    data: { name: data.name, email: data.email || null, type: data.type },
  })
  revalidatePath("/equity/shareholders")
}

export async function deleteShareholder(id: string) {
  // Holdings cascade via the schema relation.
  await prisma.shareholder.delete({ where: { id } })
  revalidatePath("/equity/shareholders")
}

export async function issueShares(input: unknown) {
  const data = shareHoldingSchema.parse(input)
  await prisma.shareHolding.create({
    data: {
      shareholderId: data.shareholderId,
      shareClassId: data.shareClassId,
      shares: data.shares,
      pricePerShare: data.pricePerShare,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
    },
  })
  revalidatePath("/equity/shareholders")
}

export async function deleteHolding(id: string) {
  await prisma.shareHolding.delete({ where: { id } })
  revalidatePath("/equity/shareholders")
}
