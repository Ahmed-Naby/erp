import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ManufacturingOrderForm } from "@/components/manufacturing/mo-form"
import { ManufacturingOrderActions } from "@/components/manufacturing/mo-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["DRAFT", "CONFIRMED", "DONE", "CANCELLED"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  DONE: "default",
  CANCELLED: "destructive",
}

export default async function ManufacturingOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, orders, products, warehouses, boms] = await Promise.all([
    prisma.manufacturingOrder.count({ where }),
    prisma.manufacturingOrder.findMany({
      where,
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.bom.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const bomOptions = boms.map((b) => ({ id: b.id, label: `${b.product.name} (×${b.quantity})` }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("manufacturingOrders.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("manufacturingOrders.subtitle")}</p>
        </div>
        <ManufacturingOrderForm products={products} warehouses={warehouses} boms={bomOptions} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("manufacturingOrders.reference")}</TableHead>
            <TableHead>{t("manufacturingOrders.product")}</TableHead>
            <TableHead className="text-right">{t("common.quantity")}</TableHead>
            <TableHead>{t("manufacturingOrders.warehouse")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">
                {o.moNumber}
                {o.status === "DRAFT" && (
                  <ManufacturingOrderForm
                    mode="edit"
                    orderId={o.id}
                    products={products}
                    warehouses={warehouses}
                    boms={bomOptions}
                    triggerVariant="ghost"
                    defaultValues={{
                      productId: o.productId,
                      quantity: o.quantity,
                      warehouseId: o.warehouseId,
                      bomId: o.bomId ?? "none",
                    }}
                  />
                )}
              </TableCell>
              <TableCell>{o.product.name}</TableCell>
              <TableCell className="text-right">{o.quantity}</TableCell>
              <TableCell>{o.warehouse.name}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[o.status] ?? "outline"}>{t(`status.${o.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <ManufacturingOrderActions id={o.id} status={o.status} />
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {t("manufacturingOrders.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
