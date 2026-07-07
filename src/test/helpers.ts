import { prisma } from "@/lib/prisma"
import { DEFAULT_ACCOUNTS } from "@/lib/accounts"

/** Wipes all mutable tables and reseeds the chart of accounts. Call once
 * per test file (beforeAll) — not between individual tests — so that
 * within a file, count()-based number generators (SO-000001, etc.) stay
 * deterministic without needing a fresh reset before every test. */
export async function resetDb() {
  await prisma.journalLine.deleteMany()
  await prisma.journalEntry.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.salesOrderLine.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.account.deleteMany()

  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.account.create({ data: account })
  }
}

export async function createFixtures() {
  const warehouse = await prisma.warehouse.create({
    data: { name: `Test Warehouse ${Date.now()}-${Math.random()}` },
  })
  const customer = await prisma.customer.create({
    data: { name: "Test Customer" },
  })
  const supplier = await prisma.supplier.create({
    data: { name: "Test Supplier" },
  })
  return { warehouse, customer, supplier }
}

export async function createTaxedProduct(
  overrides: Partial<{ costPrice: number; salePrice: number; taxRate: number }> = {}
) {
  return prisma.product.create({
    data: {
      sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: "Test Product",
      unit: "unit",
      costPrice: overrides.costPrice ?? 50,
      salePrice: overrides.salePrice ?? 100,
      taxRate: overrides.taxRate ?? 14,
      reorderLevel: 0,
    },
  })
}
