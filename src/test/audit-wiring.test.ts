import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const authMock = vi.fn()
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }))

const { prisma } = await import("@/lib/prisma")
const { resetDb, createFixtures, createTaxedProduct } = await import("@/test/helpers")
const { createSalesOrderAction, confirmSalesOrderAction, generateInvoiceAction, cancelSalesOrderAction } =
  await import("@/app/(app)/sales/orders/actions")
const {
  createPurchaseOrderAction,
  sendPurchaseOrderAction,
  receivePurchaseOrderAction,
  cancelPurchaseOrderAction,
} = await import("@/app/(app)/purchasing/orders/actions")
const { recordInvoicePaymentAction, recordPurchaseOrderPaymentAction } = await import(
  "@/app/(app)/accounting/payments/actions"
)

async function seedAdmin() {
  return prisma.user.create({
    data: {
      name: "Admin",
      email: `admin-${Date.now()}-${Math.random()}@test.local`,
      passwordHash: "x",
      role: "ADMIN",
    },
  })
}

async function auditCount(entityType: string, entityId: string) {
  return prisma.auditLog.count({ where: { entityType, entityId } })
}

describe("audit trail wiring for financial actions", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("logs sales order confirm, invoice generation, and cancel", async () => {
    const admin = await seedAdmin()
    authMock.mockResolvedValue({ user: admin })

    const { warehouse, customer } = await createFixtures()
    const product = await createTaxedProduct({ salePrice: 100, taxRate: 0 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 10 },
    })

    const order = await createSalesOrderAction({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await confirmSalesOrderAction(order.id)
    expect(await auditCount("SalesOrder", order.id)).toBe(1)

    await generateInvoiceAction(order.id)
    const invoice = await prisma.invoice.findFirstOrThrow({ where: { salesOrderId: order.id } })
    expect(await auditCount("Invoice", invoice.id)).toBe(1)

    const order2 = await createSalesOrderAction({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await cancelSalesOrderAction(order2.id)
    expect(await auditCount("SalesOrder", order2.id)).toBe(1)
  })

  it("logs purchase order send, receive, and cancel", async () => {
    const admin = await seedAdmin()
    authMock.mockResolvedValue({ user: admin })

    const { warehouse, supplier } = await createFixtures()
    const product = await createTaxedProduct({ costPrice: 20, taxRate: 0 })

    const po = await createPurchaseOrderAction({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 2, unitCost: 20, taxRate: 0 }],
    })
    await sendPurchaseOrderAction(po.id)
    await receivePurchaseOrderAction(po.id)
    expect(await auditCount("PurchaseOrder", po.id)).toBe(2)

    const po2 = await createPurchaseOrderAction({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitCost: 20, taxRate: 0 }],
    })
    await cancelPurchaseOrderAction(po2.id)
    expect(await auditCount("PurchaseOrder", po2.id)).toBe(1)
  })

  it("logs invoice and purchase order payments", async () => {
    const admin = await seedAdmin()
    authMock.mockResolvedValue({ user: admin })

    const { warehouse, customer, supplier } = await createFixtures()
    const product = await createTaxedProduct({ salePrice: 100, costPrice: 20, taxRate: 0 })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 10 },
    })

    const order = await createSalesOrderAction({
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitPrice: 100, taxRate: 0 }],
    })
    await confirmSalesOrderAction(order.id)
    await generateInvoiceAction(order.id)
    const invoice = await prisma.invoice.findFirstOrThrow({ where: { salesOrderId: order.id } })
    const payment = await recordInvoicePaymentAction(invoice.id, { amount: 100, method: "cash" })
    expect(await auditCount("Payment", payment.id)).toBe(1)

    const po = await createPurchaseOrderAction({
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      lines: [{ productId: product.id, quantity: 1, unitCost: 20, taxRate: 0 }],
    })
    await sendPurchaseOrderAction(po.id)
    await receivePurchaseOrderAction(po.id)
    const poPayment = await recordPurchaseOrderPaymentAction(po.id, { amount: 20, method: "bank" })
    expect(await auditCount("Payment", poPayment.id)).toBe(1)
  })
})
