import { beforeAll, describe, expect, it } from "vitest"

import { prisma } from "@/lib/prisma"
import { resetDb, createFixtures, createTaxedProduct } from "@/test/helpers"
import { ACCOUNT_CODES } from "@/lib/accounts"
import {
  createSalesOrder,
  confirmSalesOrder,
  generateInvoice,
  cancelSalesOrder,
} from "@/services/salesService"

describe("salesService", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("confirming an order deducts stock and generating an invoice posts a balanced, tax-inclusive journal entry", async () => {
    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct({ costPrice: 50, salePrice: 100, taxRate: 14 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 100 },
    })

    const order = await createSalesOrder({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 2, unitPrice: 100, taxRate: 14 }],
    })
    await confirmSalesOrder(order.id)

    const stockAfterConfirm = await prisma.stockItem.findUniqueOrThrow({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    })
    expect(stockAfterConfirm.quantity).toBe(98)

    const invoice = await generateInvoice(order.id)
    expect(invoice.totalAmount).toBe(228)
    expect(invoice.taxAmount).toBe(28)

    const updatedOrder = await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } })
    expect(updatedOrder.status).toBe("INVOICED")

    const invoiceEntry = await prisma.journalEntry.findFirstOrThrow({
      where: { reference: invoice.invoiceNumber, memo: { startsWith: "Invoice" } },
      include: { lines: { include: { account: true } } },
    })
    const debit = invoiceEntry.lines.reduce((s, l) => s + l.debit, 0)
    const credit = invoiceEntry.lines.reduce((s, l) => s + l.credit, 0)
    expect(debit).toBe(credit)
    const taxLine = invoiceEntry.lines.find((l) => l.account.code === ACCOUNT_CODES.TAX_PAYABLE)
    expect(taxLine?.credit).toBe(28)

    const cogsEntry = await prisma.journalEntry.findFirstOrThrow({
      where: { reference: invoice.invoiceNumber, memo: { startsWith: "COGS" } },
      include: { lines: true },
    })
    const cogsDebit = cogsEntry.lines.reduce((s, l) => s + l.debit, 0)
    const cogsCredit = cogsEntry.lines.reduce((s, l) => s + l.credit, 0)
    expect(cogsDebit).toBe(cogsCredit)
    expect(cogsDebit).toBe(100) // 2 units * costPrice 50
  })

  it("only confirms DRAFT orders", async () => {
    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct()
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 10 },
    })
    const order = await createSalesOrder({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await confirmSalesOrder(order.id)
    await expect(confirmSalesOrder(order.id)).rejects.toThrow(/Only draft orders/)
  })

  it("only cancels DRAFT orders", async () => {
    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct()
    const order = await createSalesOrder({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await cancelSalesOrder(order.id)
    const cancelled = await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } })
    expect(cancelled.status).toBe("CANCELLED")
    await expect(cancelSalesOrder(order.id)).rejects.toThrow(/Only draft orders/)
  })
})
