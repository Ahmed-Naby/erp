"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { ACCOUNT_CODES } from "@/lib/accounts"
import { postJournalEntry } from "@/services/journalService"
import { payslipSchema } from "@/lib/validations/hr-suite"

function toData(data: ReturnType<typeof payslipSchema.parse>) {
  return {
    employeeId: data.employeeId,
    period: data.period,
    basicSalary: data.basicSalary,
    allowances: data.allowances,
    deductions: data.deductions,
  }
}

export async function createPayslip(input: unknown) {
  const data = payslipSchema.parse(input)
  await prisma.payslip.create({ data: toData(data) })
  revalidatePath("/hr/payroll")
}

export async function updatePayslip(id: string, input: unknown) {
  const data = payslipSchema.parse(input)
  await prisma.payslip.update({ where: { id }, data: toData(data) })
  revalidatePath("/hr/payroll")
}

export async function setPayslipStatus(id: string, status: string) {
  if (!["DRAFT", "CONFIRMED", "PAID"].includes(status)) throw new Error("Invalid status")

  if (status === "PAID") {
    const p = await prisma.payslip.findUniqueOrThrow({
      where: { id },
      include: { employee: true },
    })
    if (p.status === "PAID") throw new Error("Payslip already paid")
    if (p.status !== "CONFIRMED") throw new Error("Only confirmed payslips can be paid")

    const net = p.basicSalary + p.allowances - p.deductions
    await prisma.$transaction(async (tx) => {
      if (net > 0) {
        await postJournalEntry(
          {
            memo: `Payroll ${p.period} — ${p.employee.name}`,
            reference: `PAY-${id.slice(0, 8)}`,
            lines: [
              { accountCode: ACCOUNT_CODES.SALARY_EXPENSE, debit: net },
              { accountCode: ACCOUNT_CODES.CASH, credit: net },
            ],
          },
          tx
        )
      }
      await tx.payslip.update({ where: { id }, data: { status: "PAID" } })
    })
    revalidatePath("/accounting/journal")
    revalidatePath("/accounting/reports")
  } else {
    await prisma.payslip.update({ where: { id }, data: { status } })
  }
  revalidatePath("/hr/payroll")
}
