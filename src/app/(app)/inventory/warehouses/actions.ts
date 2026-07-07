"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { warehouseSchema } from "@/lib/validations/inventory"

export async function createWarehouse(input: unknown) {
  const data = warehouseSchema.parse(input)
  await prisma.warehouse.create({
    data: { name: data.name, location: data.location || null },
  })
  revalidatePath("/inventory/warehouses")
}

export async function updateWarehouse(id: string, input: unknown) {
  const data = warehouseSchema.parse(input)
  await prisma.warehouse.update({
    where: { id },
    data: { name: data.name, location: data.location || null },
  })
  revalidatePath("/inventory/warehouses")
}
