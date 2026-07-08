import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEFAULT_ACCOUNTS } from "../src/lib/accounts"
import {
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  generateInvoice,
} from "../src/services/salesService"
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  sendPurchaseOrder,
} from "../src/services/purchasingService"
import { logAudit } from "../src/lib/audit"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@erp.local"
  const passwordHash = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  })

  console.log(`Seeded admin user: ${admin.email} (password: admin123)`)

  const staffEmail = "staff@erp.local"
  const staffPasswordHash = await bcrypt.hash("staff123", 10)

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      name: "Staff",
      email: staffEmail,
      passwordHash: staffPasswordHash,
      role: "STAFF",
    },
  })

  console.log(`Seeded staff user: ${staff.email} (password: staff123)`)

  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    })
  }

  console.log(`Seeded ${DEFAULT_ACCOUNTS.length} default accounts`)

  await seedDemoData(admin.id, admin.email)
}

/**
 * Idempotent demo dataset so the Odoo-style views (kanban, statusbar, chatter)
 * have realistic records to render. Runs once — guarded on a marker customer.
 * Drives records through the real services so stock moves, journal entries and
 * audit-log (chatter) entries all stay consistent. To disable demo data on a
 * clean production DB, remove the `seedDemoData(...)` call above.
 */
async function seedDemoData(adminId: string, adminEmail: string) {
  const marker = await prisma.customer.findFirst({ where: { name: "Acme Corporation" } })
  if (marker) {
    console.log("Demo data already present — skipping.")
    return
  }

  const warehouse = await prisma.warehouse.create({ data: { name: "Main Warehouse" } })

  const productSpecs = [
    { sku: "MOU-001", name: "Wireless Mouse", costPrice: 8, salePrice: 20, reorderLevel: 10, stock: 80 },
    { sku: "KEY-001", name: "Mechanical Keyboard", costPrice: 25, salePrice: 60, reorderLevel: 5, stock: 40 },
    { sku: "CAB-001", name: "USB-C Cable", costPrice: 2, salePrice: 8, reorderLevel: 20, stock: 60 },
    { sku: "MON-001", name: '27" Monitor', costPrice: 120, salePrice: 250, reorderLevel: 3, stock: 15 },
    { sku: "STA-001", name: "Laptop Stand", costPrice: 15, salePrice: 35, reorderLevel: 8, stock: 30 },
    // Intentionally below reorder level to demonstrate the dashboard low-stock alert.
    { sku: "HDM-001", name: "HDMI Adapter", costPrice: 5, salePrice: 14, reorderLevel: 15, stock: 5 },
  ]

  const products: Record<string, { id: string; salePrice: number; costPrice: number }> = {}
  for (const spec of productSpecs) {
    const product = await prisma.product.create({
      data: {
        sku: spec.sku,
        name: spec.name,
        unit: "unit",
        costPrice: spec.costPrice,
        salePrice: spec.salePrice,
        taxRate: 14,
        reorderLevel: spec.reorderLevel,
      },
    })
    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: spec.stock },
    })
    products[spec.sku] = product
  }

  const [acme, globex, initech] = await Promise.all([
    prisma.customer.create({ data: { name: "Acme Corporation" } }),
    prisma.customer.create({ data: { name: "Globex Ltd" } }),
    prisma.customer.create({ data: { name: "Initech LLC" } }),
  ])

  const [techParts, globalComponents] = await Promise.all([
    prisma.supplier.create({ data: { name: "TechParts Supply" } }),
    prisma.supplier.create({ data: { name: "Global Components Co" } }),
  ])

  const saleLine = (sku: string, quantity: number) => ({
    productId: products[sku].id,
    quantity,
    unitPrice: products[sku].salePrice,
    taxRate: 14,
  })
  const purchaseLine = (sku: string, quantity: number) => ({
    productId: products[sku].id,
    quantity,
    unitCost: products[sku].costPrice,
    taxRate: 14,
  })

  const logSO = (id: string, summary: string, action: "CREATE" | "UPDATE") =>
    logAudit({ userId: adminId, userEmail: adminEmail, action, entityType: "SalesOrder", entityId: id, summary })
  const logPO = (id: string, summary: string, action: "CREATE" | "UPDATE") =>
    logAudit({ userId: adminId, userEmail: adminEmail, action, entityType: "PurchaseOrder", entityId: id, summary })

  // --- Sales orders across every status ---
  // DRAFT
  await createSalesOrder(
    { customerId: acme.id, warehouseId: warehouse.id, lines: [saleLine("MOU-001", 2), saleLine("KEY-001", 1)] },
    adminId
  )

  // CONFIRMED
  const soConfirmed = await createSalesOrder(
    { customerId: globex.id, warehouseId: warehouse.id, lines: [saleLine("MON-001", 2)] },
    adminId
  )
  await confirmSalesOrder(soConfirmed.id, adminId)
  await logSO(soConfirmed.id, "Confirmed sales order", "UPDATE")

  // INVOICED
  const soInvoiced = await createSalesOrder(
    { customerId: initech.id, warehouseId: warehouse.id, lines: [saleLine("CAB-001", 10), saleLine("STA-001", 3)] },
    adminId
  )
  await confirmSalesOrder(soInvoiced.id, adminId)
  await logSO(soInvoiced.id, "Confirmed sales order", "UPDATE")
  const invoice = await generateInvoice(soInvoiced.id)
  await logAudit({
    userId: adminId,
    userEmail: adminEmail,
    action: "CREATE",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: "Generated invoice from sales order",
  })

  // CANCELLED
  const soCancelled = await createSalesOrder(
    { customerId: acme.id, warehouseId: warehouse.id, lines: [saleLine("KEY-001", 1)] },
    adminId
  )
  await cancelSalesOrder(soCancelled.id)
  await logSO(soCancelled.id, "Cancelled sales order", "UPDATE")

  // --- Purchase orders across every status ---
  // DRAFT
  await createPurchaseOrder(
    { supplierId: techParts.id, warehouseId: warehouse.id, lines: [purchaseLine("MOU-001", 50)] },
    adminId
  )

  // SENT
  const poSent = await createPurchaseOrder(
    { supplierId: globalComponents.id, warehouseId: warehouse.id, lines: [purchaseLine("MON-001", 10)] },
    adminId
  )
  await sendPurchaseOrder(poSent.id)
  await logPO(poSent.id, "Sent purchase order", "UPDATE")

  // RECEIVED
  const poReceived = await createPurchaseOrder(
    { supplierId: techParts.id, warehouseId: warehouse.id, lines: [purchaseLine("CAB-001", 100)] },
    adminId
  )
  await sendPurchaseOrder(poReceived.id)
  await logPO(poReceived.id, "Sent purchase order", "UPDATE")
  await receivePurchaseOrder(poReceived.id, adminId)
  await logPO(poReceived.id, "Received purchase order", "UPDATE")

  // CANCELLED
  const poCancelled = await createPurchaseOrder(
    { supplierId: globalComponents.id, warehouseId: warehouse.id, lines: [purchaseLine("KEY-001", 20)] },
    adminId
  )
  await cancelPurchaseOrder(poCancelled.id)
  await logPO(poCancelled.id, "Cancelled purchase order", "UPDATE")

  console.log("Seeded demo data: 6 products, 3 customers, 2 suppliers, 4 sales orders, 4 purchase orders.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
