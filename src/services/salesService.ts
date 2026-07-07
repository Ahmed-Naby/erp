import { prisma } from "@/lib/prisma"
import { adjustStock } from "@/services/stockService"
import { postInvoiceEntries } from "@/services/journalService"
import { computeTotals } from "@/lib/money"
import type { SalesOrderInput } from "@/lib/validations/sales"

async function nextNumber(prefix: string, count: () => Promise<number>) {
  const n = (await count()) + 1
  return `${prefix}-${String(n).padStart(6, "0")}`
}

export async function createSalesOrder(
  input: SalesOrderInput,
  userId?: string
) {
  const orderNumber = await nextNumber("SO", () => prisma.salesOrder.count())

  return prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      notes: input.notes,
      createdById: userId,
      lines: {
        create: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
        })),
      },
    },
  })
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id } })
  if (order.status !== "DRAFT") {
    throw new Error("Only draft orders can be edited")
  }

  return prisma.$transaction(async (tx) => {
    await tx.salesOrderLine.deleteMany({ where: { salesOrderId: id } })
    return tx.salesOrder.update({
      where: { id },
      data: {
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        notes: input.notes,
        lines: {
          create: input.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
          })),
        },
      },
    })
  })
}

export async function confirmSalesOrder(id: string, userId?: string) {
  const order = await prisma.salesOrder.findUniqueOrThrow({
    where: { id },
    include: { lines: true },
  })
  if (order.status !== "DRAFT") {
    throw new Error("Only draft orders can be confirmed")
  }

  return prisma.$transaction(async (tx) => {
    for (const line of order.lines) {
      await adjustStock(
        {
          productId: line.productId,
          warehouseId: order.warehouseId,
          type: "OUT",
          quantity: line.quantity,
          reference: order.orderNumber,
          note: `Sales order ${order.orderNumber}`,
          userId,
        },
        tx
      )
    }

    return tx.salesOrder.update({
      where: { id },
      data: { status: "CONFIRMED" },
    })
  })
}

export async function generateInvoice(salesOrderId: string) {
  const order = await prisma.salesOrder.findUniqueOrThrow({
    where: { id: salesOrderId },
    include: { lines: { include: { product: true } } },
  })
  if (order.status !== "CONFIRMED") {
    throw new Error("Only confirmed orders can be invoiced")
  }

  const { tax, total } = computeTotals(
    order.lines.map((line) => ({
      amount: line.quantity * line.unitPrice,
      taxRate: line.taxRate,
    }))
  )
  const costOfGoods = order.lines.reduce(
    (sum, line) => sum + line.quantity * line.product.costPrice,
    0
  )
  const invoiceNumber = await nextNumber("INV", () => prisma.invoice.count())

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        salesOrderId: order.id,
        customerId: order.customerId,
        totalAmount: total,
        taxAmount: tax,
      },
    })
    await tx.salesOrder.update({
      where: { id: order.id },
      data: { status: "INVOICED" },
    })
    await postInvoiceEntries(
      { invoiceNumber, totalAmount: total, taxAmount: tax, costOfGoods },
      tx
    )
    return invoice
  })
}

export async function cancelSalesOrder(id: string) {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id } })
  if (order.status !== "DRAFT") {
    throw new Error("Only draft orders can be cancelled")
  }
  return prisma.salesOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  })
}
