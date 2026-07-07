import { beforeAll, describe, expect, it } from "vitest"

import { prisma } from "@/lib/prisma"
import { resetDb, createFixtures, createTaxedProduct } from "@/test/helpers"
import { ACCOUNT_CODES } from "@/lib/accounts"
import {
  createPurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "@/services/purchasingService"

describe("purchasingService", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("receiving a sent order adds stock and posts a balanced journal entry with input tax", async () => {
    const { warehouse, supplier } = await createFixtures()
    const product = await createTaxedProduct({ costPrice: 50, taxRate: 14 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 5 },
    })

    const po = await createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 3, unitCost: 50, taxRate: 14 }],
    })
    await sendPurchaseOrder(po.id)
    await receivePurchaseOrder(po.id)

    const stock = await prisma.stockItem.findUniqueOrThrow({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    })
    expect(stock.quantity).toBe(8)

    const record = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: po.id } })
    expect(record.status).toBe("RECEIVED")

    const entry = await prisma.journalEntry.findFirstOrThrow({
      where: { reference: record.poNumber },
      include: { lines: { include: { account: true } } },
    })
    const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
    const credit = entry.lines.reduce((s, l) => s + l.credit, 0)
    expect(debit).toBe(credit)

    const taxLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.TAX_RECEIVABLE)
    const apLine = entry.lines.find((l) => l.account.code === ACCOUNT_CODES.ACCOUNTS_PAYABLE)
    expect(taxLine?.debit).toBe(21) // 3 * 50 * 14%
    expect(apLine?.credit).toBe(171) // 150 + 21
  })

  it("cannot receive an order that hasn't been sent", async () => {
    const { warehouse, supplier } = await createFixtures()
    const product = await createTaxedProduct()
    const po = await createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitCost: 10, taxRate: 0 }],
    })
    await expect(receivePurchaseOrder(po.id)).rejects.toThrow(/Only sent purchase orders/)
  })

  it("can cancel a draft or sent order but not a received one", async () => {
    const { warehouse, supplier } = await createFixtures()
    const product = await createTaxedProduct()
    const po = await createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitCost: 10, taxRate: 0 }],
    })
    await sendPurchaseOrder(po.id)
    await receivePurchaseOrder(po.id)
    await expect(cancelPurchaseOrder(po.id)).rejects.toThrow(
      /Only draft or sent purchase orders/
    )
  })
})
