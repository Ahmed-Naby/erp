"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { equipmentSchema } from "@/lib/validations/supply-chain"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toData(data: ReturnType<typeof equipmentSchema.parse>) {
  return {
    name: data.name,
    category: data.category || null,
    serialNumber: data.serialNumber || null,
    assignedToId: relId(data.assignedToId),
  }
}

export async function createEquipment(input: unknown) {
  const data = equipmentSchema.parse(input)
  await prisma.equipment.create({ data: toData(data) })
  revalidatePath("/maintenance/equipment")
}

export async function updateEquipment(id: string, input: unknown) {
  const data = equipmentSchema.parse(input)
  await prisma.equipment.update({ where: { id }, data: toData(data) })
  revalidatePath("/maintenance/equipment")
}

export async function deleteEquipment(id: string) {
  await prisma.equipment.delete({ where: { id } })
  revalidatePath("/maintenance/equipment")
}
