"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { supplierSchema } from "@/lib/validations/purchasing"

export async function createSupplier(input: unknown) {
  const data = supplierSchema.parse(input)
  await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  })
  revalidatePath("/purchasing/suppliers")
}

export async function updateSupplier(id: string, input: unknown) {
  const data = supplierSchema.parse(input)
  await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  })
  revalidatePath("/purchasing/suppliers")
}
