"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { shareClassSchema } from "@/lib/validations/equity"

export async function createShareClass(input: unknown) {
  const data = shareClassSchema.parse(input)
  await prisma.shareClass.create({ data: { name: data.name, parValue: data.parValue } })
  revalidatePath("/equity/classes")
  revalidatePath("/equity/shareholders")
}

export async function updateShareClass(id: string, input: unknown) {
  const data = shareClassSchema.parse(input)
  await prisma.shareClass.update({
    where: { id },
    data: { name: data.name, parValue: data.parValue },
  })
  revalidatePath("/equity/classes")
  revalidatePath("/equity/shareholders")
}

export async function deleteShareClass(id: string) {
  const holdings = await prisma.shareHolding.count({ where: { shareClassId: id } })
  if (holdings > 0) {
    throw new Error("Cannot delete a share class that still has issued shares")
  }
  await prisma.shareClass.delete({ where: { id } })
  revalidatePath("/equity/classes")
}
