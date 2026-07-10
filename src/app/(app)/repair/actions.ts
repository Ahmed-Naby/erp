"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { repairOrderSchema } from "@/lib/validations/supply-chain"
import { nextSequence } from "@/services/counter"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

export async function createRepairOrder(input: unknown) {
  const data = repairOrderSchema.parse(input)
  await prisma.$transaction(async (tx) => {
    const repairNumber = await nextSequence("repairOrder", "RO", tx)
    await tx.repairOrder.create({
      data: {
        repairNumber,
        productId: data.productId,
        customerId: relId(data.customerId),
        description: data.description || null,
      },
    })
  })
  revalidatePath("/repair")
}

export async function updateRepairOrder(id: string, input: unknown) {
  const data = repairOrderSchema.parse(input)
  await prisma.repairOrder.update({
    where: { id },
    data: {
      productId: data.productId,
      customerId: relId(data.customerId),
      description: data.description || null,
    },
  })
  revalidatePath("/repair")
}

const VALID = ["DRAFT", "CONFIRMED", "REPAIRED", "DONE", "CANCELLED"]

export async function setRepairStatus(id: string, status: string) {
  if (!VALID.includes(status)) throw new Error("Invalid status")
  await prisma.repairOrder.update({ where: { id }, data: { status } })
  revalidatePath("/repair")
}
