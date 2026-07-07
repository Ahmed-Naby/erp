import { PurchaseOrderForm } from "@/components/purchasing/purchase-order-form"
import { prisma } from "@/lib/prisma"

export default async function NewPurchaseOrderPage() {
  const [suppliers, warehouses, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, costPrice: true, taxRate: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <PurchaseOrderForm suppliers={suppliers} warehouses={warehouses} products={products} />
    </div>
  )
}
