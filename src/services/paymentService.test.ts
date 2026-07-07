import { beforeAll, describe, expect, it } from "vitest"

import { prisma } from "@/lib/prisma"
import { resetDb, createFixtures, createTaxedProduct } from "@/test/helpers"
import { ACCOUNT_CODES } from "@/lib/accounts"
import { createSalesOrder, confirmSalesOrder, generateInvoice } from "@/services/salesService"
import {
  createPurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
} from "@/services/purchasingService"
import { recordInvoicePayment, recordPurchaseOrderPayment } from "@/services/paymentService"

describe("paymentService", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("recording an invoice payment posts Cash/AR and marks the invoice PAID once fully paid", async () => {
    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct({ salePrice: 100, taxRate: 0 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 10 },
    })
    const order = await createSalesOrder({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await confirmSalesOrder(order.id)
    const invoice = await generateInvoice(order.id)

    const payment = await recordInvoicePayment(invoice.id, 100, "cash")

    const entry = await prisma.journalEntry.findFirstOrThrow({
      where: { reference: payment.paymentNumber },
      include: { lines: { include: { account: true } } },
    })
    const cashLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.CASH)
    const arLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.ACCOUNTS_RECEIVABLE)
    expect(cashLine?.debit).toBe(100)
    expect(arLine?.credit).toBe(100)

    const updatedInvoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })
    expect(updatedInvoice.status).toBe("PAID")
  })

  it("rejects a payment that exceeds the amount owed", async () => {
    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct({ salePrice: 50, taxRate: 0 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 10 },
    })
    const order = await createSalesOrder({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 50, taxRate: 0 }],
    })
    await confirmSalesOrder(order.id)
    const invoice = await generateInvoice(order.id)

    await expect(recordInvoicePayment(invoice.id, 1000, "cash")).rejects.toThrow(
      /exceeds amount owed/
    )
  })

  it("recording a purchase order payment posts AP/Cash", async () => {
    const { warehouse, supplier } = await createFixtures()
    const product = await createTaxedProduct({ costPrice: 20, taxRate: 0 })
    const po = await createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 2, unitCost: 20, taxRate: 0 }],
    })
    await sendPurchaseOrder(po.id)
    await receivePurchaseOrder(po.id)

    const payment = await recordPurchaseOrderPayment(po.id, 40, "bank")

    const entry = await prisma.journalEntry.findFirstOrThrow({
      where: { reference: payment.paymentNumber },
      include: { lines: { include: { account: true } } },
    })
    const apLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.ACCOUNTS_PAYABLE)
    const cashLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.CASH)
    expect(apLine?.debit).toBe(40)
    expect(cashLine?.credit).toBe(40)
  })
})
