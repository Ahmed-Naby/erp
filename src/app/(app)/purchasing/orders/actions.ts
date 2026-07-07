"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { purchaseOrderSchema } from "@/lib/validations/purchasing"
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  sendPurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchasingService"

export async function createPurchaseOrderAction(input: unknown) {
  const data = purchaseOrderSchema.parse(input)
  const session = await auth()
  const order = await createPurchaseOrder(data, session?.user?.id)
  revalidatePath("/purchasing/orders")
  return { id: order.id }
}

export async function updatePurchaseOrderAction(id: string, input: unknown) {
  const data = purchaseOrderSchema.parse(input)
  await updatePurchaseOrder(id, data)
  revalidatePath("/purchasing/orders")
  revalidatePath(`/purchasing/orders/${id}`)
  return { id }
}

export async function sendPurchaseOrderAction(id: string) {
  const session = await auth()
  await sendPurchaseOrder(id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "PurchaseOrder",
    entityId: id,
    summary: "Sent purchase order",
  })
  revalidatePath("/purchasing/orders")
  revalidatePath(`/purchasing/orders/${id}`)
}

export async function receivePurchaseOrderAction(id: string) {
  const session = await auth()
  await receivePurchaseOrder(id, session?.user?.id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "PurchaseOrder",
    entityId: id,
    summary: "Received purchase order",
  })
  revalidatePath("/purchasing/orders")
  revalidatePath(`/purchasing/orders/${id}`)
  revalidatePath("/inventory/products")
  revalidatePath("/inventory/stock-movements")
}

export async function cancelPurchaseOrderAction(id: string) {
  const session = await auth()
  await cancelPurchaseOrder(id)
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "PurchaseOrder",
    entityId: id,
    summary: "Cancelled purchase order",
  })
  revalidatePath("/purchasing/orders")
  revalidatePath(`/purchasing/orders/${id}`)
}
