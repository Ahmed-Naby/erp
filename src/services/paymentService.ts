import { prisma } from "@/lib/prisma"
import { postPaymentEntries } from "@/services/journalService"
import { computeTotals } from "@/lib/money"

async function nextPaymentNumber(count: () => Promise<number>) {
  const n = (await count()) + 1
  return `PMT-${String(n).padStart(6, "0")}`
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method?: string,
  userId?: string
) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0")
  }
  const remaining = invoice.totalAmount - invoice.paidAmount
  if (amount > remaining + 0.01) {
    throw new Error(`Payment exceeds amount owed (${remaining.toFixed(2)} remaining)`)
  }

  const paymentNumber = await nextPaymentNumber(() => prisma.payment.count())

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        type: "RECEIVED",
        amount,
        method,
        invoiceId,
        createdById: userId,
      },
    })

    const newPaidAmount = invoice.paidAmount + amount
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= invoice.totalAmount - 0.01 ? "PAID" : "UNPAID",
      },
    })

    await postPaymentEntries({ paymentNumber, type: "RECEIVED", amount }, tx)

    return payment
  })
}

export async function recordPurchaseOrderPayment(
  purchaseOrderId: string,
  amount: number,
  method?: string,
  userId?: string
) {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrderId },
    include: { lines: true },
  })
  if (order.status !== "RECEIVED") {
    throw new Error("Only received purchase orders can be paid")
  }
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0")
  }
  const { total } = computeTotals(
    order.lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))
  )
  const remaining = total - order.paidAmount
  if (amount > remaining + 0.01) {
    throw new Error(`Payment exceeds amount owed (${remaining.toFixed(2)} remaining)`)
  }

  const paymentNumber = await nextPaymentNumber(() => prisma.payment.count())

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        type: "PAID",
        amount,
        method,
        purchaseOrderId,
        createdById: userId,
      },
    })

    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { paidAmount: order.paidAmount + amount },
    })

    await postPaymentEntries({ paymentNumber, type: "PAID", amount }, tx)

    return payment
  })
}
