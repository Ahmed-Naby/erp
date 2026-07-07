import { prisma } from "@/lib/prisma"
import { adjustStock } from "@/services/stockService"
import { postPurchaseReceiptEntries } from "@/services/journalService"
import { computeTotals } from "@/lib/money"
import type { PurchaseOrderInput } from "@/lib/validations/purchasing"

async function nextNumber(prefix: string, count: () => Promise<number>) {
  const n = (await count()) + 1
  return `${prefix}-${String(n).padStart(6, "0")}`
}

export async function createPurchaseOrder(
  input: PurchaseOrderInput,
  userId?: string
) {
  const poNumber = await nextNumber("PO", () => prisma.purchaseOrder.count())

  return prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      notes: input.notes,
      createdById: userId,
      lines: {
        create: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          taxRate: line.taxRate,
        })),
      },
    },
  })
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput) {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } })
  if (order.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be edited")
  }

  return prisma.$transaction(async (tx) => {
    await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } })
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        notes: input.notes,
        lines: {
          create: input.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            taxRate: line.taxRate,
          })),
        },
      },
    })
  })
}

export async function sendPurchaseOrder(id: string) {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } })
  if (order.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be sent")
  }
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "SENT" },
  })
}

export async function receivePurchaseOrder(id: string, userId?: string) {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: { lines: true },
  })
  if (order.status !== "SENT") {
    throw new Error("Only sent purchase orders can be received")
  }

  return prisma.$transaction(async (tx) => {
    for (const line of order.lines) {
      await adjustStock(
        {
          productId: line.productId,
          warehouseId: order.warehouseId,
          type: "IN",
          quantity: line.quantity,
          reference: order.poNumber,
          note: `Purchase order ${order.poNumber}`,
          userId,
        },
        tx
      )
    }

    const { subtotal, tax } = computeTotals(
      order.lines.map((line) => ({
        amount: line.quantity * line.unitCost,
        taxRate: line.taxRate,
      }))
    )
    await postPurchaseReceiptEntries(
      { poNumber: order.poNumber, subtotal, taxAmount: tax },
      tx
    )

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED" },
    })
  })
}

export async function cancelPurchaseOrder(id: string) {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } })
  if (order.status !== "DRAFT" && order.status !== "SENT") {
    throw new Error("Only draft or sent purchase orders can be cancelled")
  }
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  })
}
