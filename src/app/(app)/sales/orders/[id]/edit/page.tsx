import { notFound } from "next/navigation"

import { SalesOrderForm } from "@/components/sales/sales-order-form"
import { prisma } from "@/lib/prisma"

export default async function EditSalesOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, customers, warehouses, products] = await Promise.all([
    prisma.salesOrder.findUnique({ where: { id }, include: { lines: true } }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, salePrice: true, taxRate: true },
    }),
  ])

  if (!order || order.status !== "DRAFT") notFound()

  return (
    <div className="space-y-6">
      <SalesOrderForm
        mode="edit"
        orderId={order.id}
        customers={customers}
        warehouses={warehouses}
        products={products}
        defaultValues={{
          customerId: order.customerId,
          warehouseId: order.warehouseId,
          notes: order.notes ?? "",
          lines: order.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
          })),
        }}
      />
    </div>
  )
}
