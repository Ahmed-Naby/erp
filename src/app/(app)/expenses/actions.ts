"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { ACCOUNT_CODES } from "@/lib/accounts"
import { postJournalEntry } from "@/services/journalService"
import { expenseSchema } from "@/lib/validations/hr-suite"

function toData(data: ReturnType<typeof expenseSchema.parse>) {
  return {
    employeeId: data.employeeId,
    description: data.description,
    category: data.category,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
  }
}

export async function createExpense(input: unknown) {
  const data = expenseSchema.parse(input)
  await prisma.expense.create({ data: toData(data) })
  revalidatePath("/expenses")
}

export async function updateExpense(id: string, input: unknown) {
  const data = expenseSchema.parse(input)
  await prisma.expense.update({ where: { id }, data: toData(data) })
  revalidatePath("/expenses")
}

const VALID = ["DRAFT", "SUBMITTED", "APPROVED", "REFUSED", "POSTED"]

export async function setExpenseStatus(id: string, status: string) {
  if (!VALID.includes(status)) throw new Error("Invalid status")

  if (status === "POSTED") {
    const expense = await prisma.expense.findUniqueOrThrow({
      where: { id },
      include: { employee: true },
    })
    if (expense.status === "POSTED") throw new Error("Expense already posted")
    if (expense.status !== "APPROVED") throw new Error("Only approved expenses can be posted")

    await prisma.$transaction(async (tx) => {
      // Debit the expense account, credit cash (company paid it).
      await postJournalEntry(
        {
          memo: `Expense: ${expense.description} (${expense.employee.name})`,
          reference: `EXP-${id.slice(0, 8)}`,
          lines: [
            { accountCode: ACCOUNT_CODES.OPERATING_EXPENSES, debit: expense.amount },
            { accountCode: ACCOUNT_CODES.CASH, credit: expense.amount },
          ],
        },
        tx
      )
      await tx.expense.update({ where: { id }, data: { status: "POSTED" } })
    })
    revalidatePath("/accounting/journal")
    revalidatePath("/accounting/reports")
  } else {
    await prisma.expense.update({ where: { id }, data: { status } })
  }
  revalidatePath("/expenses")
}
