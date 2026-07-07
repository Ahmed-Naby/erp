import { notFound } from "next/navigation"

import { PurchaseOrderForm } from "@/components/purchasing/purchase-order-form"
import { prisma } from "@/lib/prisma"

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, suppliers, warehouses, products] = await Promise.all([
    prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, costPrice: true, taxRate: true },
    }),
  ])

  if (!order || order.status !== "DRAFT") notFound()

  return (
    <div className="space-y-6">
      <PurchaseOrderForm
        mode="edit"
        orderId={order.id}
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        defaultValues={{
          supplierId: order.supplierId,
          warehouseId: order.warehouseId,
          notes: order.notes ?? "",
          lines: order.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            taxRate: l.taxRate,
          })),
        }}
      />
    </div>
  )
}
