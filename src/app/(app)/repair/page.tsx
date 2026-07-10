import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RepairForm } from "@/components/repair/repair-form"
import { RepairActions } from "@/components/repair/repair-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["DRAFT", "CONFIRMED", "REPAIRED", "DONE", "CANCELLED"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  REPAIRED: "secondary",
  DONE: "default",
  CANCELLED: "destructive",
}

export default async function RepairPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, orders, products, customers] = await Promise.all([
    prisma.repairOrder.count({ where }),
    prisma.repairOrder.findMany({
      where,
      include: { product: true, customer: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("repair.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("repair.subtitle")}</p>
        </div>
        <RepairForm products={products} customers={customers} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("repair.reference")}</TableHead>
            <TableHead>{t("repair.product")}</TableHead>
            <TableHead>{t("repair.customer")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">
                {o.repairNumber}
                {o.status === "DRAFT" && (
                  <RepairForm
                    mode="edit"
                    repairId={o.id}
                    products={products}
                    customers={customers}
                    triggerVariant="ghost"
                    defaultValues={{
                      productId: o.productId,
                      customerId: o.customerId ?? "none",
                      description: o.description ?? "",
                    }}
                  />
                )}
              </TableCell>
              <TableCell>{o.product.name}</TableCell>
              <TableCell>{o.customer?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[o.status] ?? "outline"}>{t(`status.${o.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <RepairActions id={o.id} status={o.status} />
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("repair.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
