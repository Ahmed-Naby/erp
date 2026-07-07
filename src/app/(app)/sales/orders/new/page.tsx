import { SalesOrderForm } from "@/components/sales/sales-order-form"
import { prisma } from "@/lib/prisma"

export default async function NewSalesOrderPage() {
  const [customers, warehouses, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, salePrice: true, taxRate: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <SalesOrderForm customers={customers} warehouses={warehouses} products={products} />
    </div>
  )
}
