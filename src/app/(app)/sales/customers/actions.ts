"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { customerSchema } from "@/lib/validations/sales"

export async function createCustomer(input: unknown) {
  const data = customerSchema.parse(input)
  await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  })
  revalidatePath("/sales/customers")
}

export async function updateCustomer(id: string, input: unknown) {
  const data = customerSchema.parse(input)
  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  })
  revalidatePath("/sales/customers")
}
