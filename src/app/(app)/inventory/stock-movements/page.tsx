import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()
  const [total, movements, products, warehouses] = await Promise.all([
    prisma.stockMovement.count(),
    prisma.stockMovement.findMany({
      include: { product: true, warehouse: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("stockMovements.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("stockMovements.subtitle")}</p>
        </div>
        <StockAdjustmentForm products={products} warehouses={warehouses} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("stockMovements.product")}</TableHead>
            <TableHead>{t("stockMovements.warehouse")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead className="text-right">{t("common.quantity")}</TableHead>
            <TableHead>{t("stockMovements.reference")}</TableHead>
            <TableHead>{t("stockMovements.note")}</TableHead>
            <TableHead>{t("audit.user")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {m.createdAt.toLocaleString()}
              </TableCell>
              <TableCell>{m.product.name}</TableCell>
              <TableCell>{m.warehouse.name}</TableCell>
              <TableCell>{m.type}</TableCell>
              <TableCell
                className={`text-right font-medium ${
                  m.quantity < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </TableCell>
              <TableCell>{m.reference ?? "—"}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {m.note ?? "—"}
              </TableCell>
              <TableCell>{m.createdBy?.name ?? "—"}</TableCell>
            </TableRow>
          ))}
          {movements.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                {t("stockMovements.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
