"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { salesOrderSchema } from "@/lib/validations/sales"
import {
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  generateInvoice,
  updateSalesOrder,
} from "@/services/salesService"

export async function createSalesOrderAction(input: unknown) {
  const data = salesOrderSchema.parse(input)
  const session = await auth()
  const order = await createSalesOrder(data, session?.user?.id)
  revalidatePath("/sales/orders")
  return { id: order.id }
}

export async function updateSalesOrderAction(id: string, input: unknown) {
  const data = salesOrderSchema.parse(input)
  await updateSalesOrder(id, data)
  revalidatePath("/sales/orders")
  revalidatePath(`/sales/orders/${id}`)
  return { id }
}

export async function confirmSalesOrderAction(id: string) {
  const session = await auth()
  await confirmSalesOrder(id, session?.user?.id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "SalesOrder",
    entityId: id,
    summary: "Confirmed sales order",
  })
  revalidatePath("/sales/orders")
  revalidatePath(`/sales/orders/${id}`)
  revalidatePath("/inventory/products")
  revalidatePath("/inventory/stock-movements")
}

export async function generateInvoiceAction(id: string) {
  const session = await auth()
  const invoice = await generateInvoice(id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "CREATE",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: "Generated invoice from sales order",
  })
  revalidatePath("/sales/orders")
  revalidatePath(`/sales/orders/${id}`)
  revalidatePath("/sales/invoices")
}

export async function cancelSalesOrderAction(id: string) {
  const session = await auth()
  await cancelSalesOrder(id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "SalesOrder",
    entityId: id,
    summary: "Cancelled sales order",
  })
  revalidatePath("/sales/orders")
  revalidatePath(`/sales/orders/${id}`)
}
