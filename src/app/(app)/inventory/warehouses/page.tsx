import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WarehouseForm } from "@/components/inventory/warehouse-form"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function WarehousesPage() {
  const { t } = await getTranslations()
  const warehouses = await prisma.warehouse.findMany({
    include: { stockItems: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("warehouses.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("warehouses.subtitle")}</p>
        </div>
        <WarehouseForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("warehouses.location")}</TableHead>
            <TableHead className="text-right">{t("products.title")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((w) => (
            <TableRow key={w.id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.location ?? "—"}</TableCell>
              <TableCell className="text-right">{w.stockItems.length}</TableCell>
              <TableCell className="text-right">
                <WarehouseForm
                  mode="edit"
                  warehouseId={w.id}
                  defaultValues={{ name: w.name, location: w.location ?? "" }}
                />
              </TableCell>
            </TableRow>
          ))}
          {warehouses.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("warehouses.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
