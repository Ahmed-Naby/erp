"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { contactSchema } from "@/lib/validations/contacts"

function toPayload(data: { name: string; email?: string; phone?: string; address?: string }) {
  return {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
  }
}

export async function createContact(input: unknown) {
  const data = contactSchema.parse(input)
  const payload = toPayload(data)
  if (data.kind === "customer") {
    await prisma.customer.create({ data: payload })
  } else {
    await prisma.supplier.create({ data: payload })
  }
  revalidatePath("/contacts")
}

export async function updateContact(kind: string, id: string, input: unknown) {
  const data = contactSchema.parse(input)
  const payload = toPayload(data)
  if (kind === "customer") {
    await prisma.customer.update({ where: { id }, data: payload })
  } else if (kind === "vendor") {
    await prisma.supplier.update({ where: { id }, data: payload })
  } else {
    throw new Error("Unknown contact type")
  }
  revalidatePath("/contacts")
  revalidatePath(`/contacts/${kind}/${id}`)
}
