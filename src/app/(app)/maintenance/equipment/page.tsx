import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EquipmentForm } from "@/components/maintenance/equipment-form"
import { EquipmentDelete } from "@/components/maintenance/equipment-delete"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const page = parsePage(pageParam)

  const [total, equipment, employees] = await Promise.all([
    prisma.equipment.count(),
    prisma.equipment.findMany({
      include: { assignedTo: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("equipment.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("equipment.subtitle")}</p>
        </div>
        <EquipmentForm employees={employees} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("equipment.category")}</TableHead>
            <TableHead>{t("equipment.serialNumber")}</TableHead>
            <TableHead>{t("equipment.assignedTo")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell>{e.category ?? "—"}</TableCell>
              <TableCell>{e.serialNumber ?? "—"}</TableCell>
              <TableCell>{e.assignedTo?.name ?? "—"}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <EquipmentForm
                    mode="edit"
                    equipmentId={e.id}
                    employees={employees}
                    triggerVariant="ghost"
                    defaultValues={{
                      name: e.name,
                      category: e.category ?? "",
                      serialNumber: e.serialNumber ?? "",
                      assignedToId: e.assignedToId ?? "none",
                    }}
                  />
                  <EquipmentDelete id={e.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {equipment.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("equipment.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
