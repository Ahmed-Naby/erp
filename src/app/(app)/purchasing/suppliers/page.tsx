import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SupplierForm } from "@/components/purchasing/supplier-form"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function SuppliersPage() {
  const { t } = await getTranslations()
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { purchaseOrders: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("suppliers.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("suppliers.subtitle")}</p>
        </div>
        <SupplierForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("common.phone")}</TableHead>
            <TableHead className="text-right">{t("suppliers.orders")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.email ?? "—"}</TableCell>
              <TableCell>{s.phone ?? "—"}</TableCell>
              <TableCell className="text-right">{s._count.purchaseOrders}</TableCell>
              <TableCell className="text-right">
                <SupplierForm
                  mode="edit"
                  supplierId={s.id}
                  defaultValues={{
                    name: s.name,
                    email: s.email ?? "",
                    phone: s.phone ?? "",
                    address: s.address ?? "",
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          {suppliers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("suppliers.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
