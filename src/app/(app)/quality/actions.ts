"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { qualityCheckSchema } from "@/lib/validations/supply-chain"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toData(data: ReturnType<typeof qualityCheckSchema.parse>) {
  return {
    title: data.title,
    productId: relId(data.productId),
    note: data.note || null,
  }
}

export async function createQualityCheck(input: unknown) {
  const data = qualityCheckSchema.parse(input)
  await prisma.qualityCheck.create({ data: toData(data) })
  revalidatePath("/quality")
}

export async function updateQualityCheck(id: string, input: unknown) {
  const data = qualityCheckSchema.parse(input)
  await prisma.qualityCheck.update({ where: { id }, data: toData(data) })
  revalidatePath("/quality")
}

const VALID = ["PENDING", "PASS", "FAIL"]

export async function setQualityStatus(id: string, status: string) {
  if (!VALID.includes(status)) throw new Error("Invalid status")
  await prisma.qualityCheck.update({ where: { id }, data: { status } })
  revalidatePath("/quality")
}
