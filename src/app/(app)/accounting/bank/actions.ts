"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/rbac"
import { bankStatementLineSchema } from "@/lib/validations/accounting"

export async function addBankLine(input: unknown) {
  await requireAdmin()
  const data = bankStatementLineSchema.parse(input)
  await prisma.bankStatementLine.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      amount: data.amount,
    },
  })
  revalidatePath("/accounting/bank")
}

export async function matchBankLine(lineId: string, paymentId: string) {
  await requireAdmin()
  const existing = await prisma.bankStatementLine.findUnique({ where: { paymentId } })
  if (existing && existing.id !== lineId) {
    throw new Error("That payment is already matched to another statement line")
  }
  await prisma.bankStatementLine.update({
    where: { id: lineId },
    data: { paymentId, reconciled: true },
  })
  revalidatePath("/accounting/bank")
}

export async function unmatchBankLine(lineId: string) {
  await requireAdmin()
  await prisma.bankStatementLine.update({
    where: { id: lineId },
    data: { paymentId: null, reconciled: false },
  })
  revalidatePath("/accounting/bank")
}

export async function deleteBankLine(lineId: string) {
  await requireAdmin()
  await prisma.bankStatementLine.delete({ where: { id: lineId } })
  revalidatePath("/accounting/bank")
}
