"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { bomSchema } from "@/lib/validations/supply-chain"

export async function createBom(input: unknown) {
  const data = bomSchema.parse(input)
  await prisma.bom.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      lines: {
        create: data.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      },
    },
  })
  revalidatePath("/manufacturing/boms")
}

export async function updateBom(id: string, input: unknown) {
  const data = bomSchema.parse(input)
  await prisma.$transaction(async (tx) => {
    await tx.bomLine.deleteMany({ where: { bomId: id } })
    await tx.bom.update({
      where: { id },
      data: {
        productId: data.productId,
        quantity: data.quantity,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      },
    })
  })
  revalidatePath("/manufacturing/boms")
}

export async function deleteBom(id: string) {
  await prisma.bom.delete({ where: { id } })
  revalidatePath("/manufacturing/boms")
}
