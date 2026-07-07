"use server"

import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { requireAdmin } from "@/lib/rbac"
import { paymentSchema } from "@/lib/validations/payments"
import { recordInvoicePayment, recordPurchaseOrderPayment } from "@/services/paymentService"

function revalidateAccountingPaths() {
  revalidatePath("/accounting/payments")
  revalidatePath("/accounting/journal")
  revalidatePath("/accounting/accounts")
  revalidatePath("/accounting/reports")
}

export async function recordInvoicePaymentAction(invoiceId: string, input: unknown) {
  const data = paymentSchema.parse(input)
  const user = await requireAdmin()
  const payment = await recordInvoicePayment(invoiceId, data.amount, data.method, user.id)
  await logAudit({
    userId: user.id,
    userEmail: user.email ?? "unknown",
    action: "CREATE",
    entityType: "Payment",
    entityId: payment.id,
    summary: `Recorded payment of ${data.amount} on invoice ${invoiceId}`,
  })
  revalidatePath("/sales/invoices")
  revalidateAccountingPaths()
  return { id: payment.id }
}

export async function recordPurchaseOrderPaymentAction(
  purchaseOrderId: string,
  input: unknown
) {
  const data = paymentSchema.parse(input)
  const user = await requireAdmin()
  const payment = await recordPurchaseOrderPayment(
    purchaseOrderId,
    data.amount,
    data.method,
    user.id
  )
  await logAudit({
    userId: user.id,
    userEmail: user.email ?? "unknown",
    action: "CREATE",
    entityType: "Payment",
    entityId: payment.id,
    summary: `Recorded payment of ${data.amount} on purchase order ${purchaseOrderId}`,
  })
  revalidatePath("/purchasing/orders")
  revalidateAccountingPaths()
  return { id: payment.id }
}
