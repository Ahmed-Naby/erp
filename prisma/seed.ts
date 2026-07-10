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

  await ensureCounters()
  await seedDemoData(admin.id, admin.email)
  await seedDemoHr()
  await seedDemoCrm(admin.id, admin.email)
  await seedDemoHrSuite()
}

/** Idempotent HR-suite demo data — guarded on any existing job position. */
async function seedDemoHrSuite() {
  const existing = await prisma.jobPosition.findFirst()
  if (existing) {
    console.log("HR-suite demo data already present — skipping.")
    return
  }
  const employees = await prisma.employee.findMany({ orderBy: { name: "asc" }, take: 5 })
  if (employees.length < 3) return
  const [e0, e1, e2] = employees
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }

  await prisma.timeOff.createMany({
    data: [
      { employeeId: e0.id, type: "ANNUAL", startDate: day(7), endDate: day(10), days: 3, reason: "Family trip", status: "APPROVED" },
      { employeeId: e1.id, type: "SICK", startDate: day(-1), endDate: day(-1), days: 1, status: "DRAFT" },
      { employeeId: e2.id, type: "UNPAID", startDate: day(20), endDate: day(21), days: 2, status: "DRAFT" },
    ],
  })

  await prisma.attendance.createMany({
    data: [
      { employeeId: e0.id, checkIn: day(-1), checkOut: new Date(day(-1).getTime() + 8 * 3_600_000) },
      { employeeId: e1.id, checkIn: new Date(Date.now() - 3 * 3_600_000) },
    ],
  })

  await prisma.expense.createMany({
    data: [
      { employeeId: e0.id, description: "Client lunch", category: "MEALS", amount: 45, status: "SUBMITTED" },
      { employeeId: e2.id, description: "Taxi to client site", category: "TRAVEL", amount: 20, status: "DRAFT" },
      { employeeId: e1.id, description: "Printer paper", category: "SUPPLIES", amount: 12.5, status: "APPROVED" },
    ],
  })

  const sales = await prisma.jobPosition.create({ data: { title: "Sales Representative", isOpen: true } })
  const warehouse = await prisma.jobPosition.create({ data: { title: "Warehouse Associate", isOpen: true } })
  await prisma.applicant.createMany({
    data: [
      { name: "Layla Mansour", email: "layla@example.com", jobPositionId: sales.id, stage: "NEW" },
      { name: "Karim Fouad", email: "karim@example.com", jobPositionId: sales.id, stage: "INTERVIEW" },
      { name: "Hana Saeed", email: "hana@example.com", jobPositionId: warehouse.id, stage: "OFFER" },
      { name: "Tarek Nabil", jobPositionId: warehouse.id, stage: "HIRED" },
      { name: "Dina Samir", jobPositionId: sales.id, stage: "REFUSED" },
    ],
  })

  await prisma.appraisal.createMany({
    data: [
      { employeeId: e0.id, rating: 4, feedback: "Strong quarter, exceeded targets.", status: "DONE" },
      { employeeId: e1.id, status: "DRAFT" },
    ],
  })

  console.log("Seeded HR-suite demo data: time off, attendances, expenses, 2 jobs + 5 applicants, appraisals.")
}

/**
 * Baselines the atomic document-number counters. Each counter starts at the
 * current row count for that entity, so an existing database with SO-000004
 * already present continues at 000005 (no collisions), while a fresh database
 * starts at 0. Idempotent: once a counter exists it is left untouched.
 */
async function ensureCounters() {
  const specs: { key: string; count: () => Promise<number> }[] = [
    { key: "salesOrder", count: () => prisma.salesOrder.count() },
    { key: "invoice", count: () => prisma.invoice.count() },
    { key: "purchaseOrder", count: () => prisma.purchaseOrder.count() },
    { key: "journalEntry", count: () => prisma.journalEntry.count() },
    { key: "payment", count: () => prisma.payment.count() },
  ]
  for (const spec of specs) {
    const value = await spec.count()
    await prisma.counter.upsert({
      where: { key: spec.key },
      create: { key: spec.key, value },
      update: {},
    })
  }
  console.log("Ensured document-number counters.")
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

/** Idempotent HR demo data — guarded on any existing department. */
async function seedDemoHr() {
  const existing = await prisma.department.findFirst()
  if (existing) {
    console.log("HR demo data already present — skipping.")
    return
  }

  const [sales, operations, finance] = await Promise.all([
    prisma.department.create({ data: { name: "Sales" } }),
    prisma.department.create({ data: { name: "Operations" } }),
    prisma.department.create({ data: { name: "Finance" } }),
  ])

  const ceo = await prisma.employee.create({
    data: {
      name: "Sara Hassan",
      jobTitle: "Chief Executive Officer",
      workEmail: "sara.hassan@erp.local",
      workPhone: "+20 100 000 0001",
      hireDate: new Date("2019-02-01"),
    },
  })

  const salesManager = await prisma.employee.create({
    data: {
      name: "Omar Ali",
      jobTitle: "Sales Manager",
      workEmail: "omar.ali@erp.local",
      workPhone: "+20 100 000 0002",
      departmentId: sales.id,
      managerId: ceo.id,
      hireDate: new Date("2020-06-15"),
    },
  })

  await prisma.employee.createMany({
    data: [
      {
        name: "Mona Adel",
        jobTitle: "Account Executive",
        workEmail: "mona.adel@erp.local",
        departmentId: sales.id,
        managerId: salesManager.id,
        hireDate: new Date("2021-09-01"),
      },
      {
        name: "Youssef Ibrahim",
        jobTitle: "Warehouse Supervisor",
        workEmail: "youssef.ibrahim@erp.local",
        departmentId: operations.id,
        managerId: ceo.id,
        hireDate: new Date("2021-01-10"),
      },
      {
        name: "Nour Khaled",
        jobTitle: "Accountant",
        workEmail: "nour.khaled@erp.local",
        departmentId: finance.id,
        managerId: ceo.id,
        hireDate: new Date("2022-03-20"),
      },
    ],
  })

  console.log("Seeded HR demo data: 3 departments, 5 employees.")
}

/** Idempotent CRM demo data — guarded on any existing opportunity. */
async function seedDemoCrm(adminId: string, adminEmail: string) {
  const existing = await prisma.opportunity.findFirst()
  if (existing) {
    console.log("CRM demo data already present — skipping.")
    return
  }

  const [acme, globex, initech] = await Promise.all([
    prisma.customer.findFirst({ where: { name: "Acme Corporation" } }),
    prisma.customer.findFirst({ where: { name: "Globex Ltd" } }),
    prisma.customer.findFirst({ where: { name: "Initech LLC" } }),
  ])

  const specs = [
    { name: "Acme — annual hardware refresh", customerId: acme?.id, expectedRevenue: 15000, stage: "WON" },
    { name: "Globex — 50 monitor rollout", customerId: globex?.id, expectedRevenue: 12000, stage: "PROPOSITION" },
    { name: "Initech — office starter kits", customerId: initech?.id, expectedRevenue: 8000, stage: "QUALIFIED" },
    { name: "Acme — accessories upsell", customerId: acme?.id, expectedRevenue: 3500, stage: "NEW" },
    { name: "Globex — cancelled pilot", customerId: globex?.id, expectedRevenue: 2000, stage: "LOST" },
  ]

  for (const spec of specs) {
    const opportunity = await prisma.opportunity.create({
      data: {
        name: spec.name,
        customerId: spec.customerId,
        expectedRevenue: spec.expectedRevenue,
        stage: spec.stage,
        ownerId: adminId,
      },
    })
    if (spec.stage !== "NEW") {
      await logAudit({
        userId: adminId,
        userEmail: adminEmail,
        action: "UPDATE",
        entityType: "Opportunity",
        entityId: opportunity.id,
        summary: `Moved to ${spec.stage.charAt(0)}${spec.stage.slice(1).toLowerCase()}`,
      })
    }
  }

  console.log("Seeded CRM demo data: 5 opportunities.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
