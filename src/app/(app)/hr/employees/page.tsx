import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmployeeForm } from "@/components/hr/employee-form"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const { t } = await getTranslations()
  const activeView = view === "kanban" ? "kanban" : "list"

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true, manager: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ])

  const employeeOptions = employees.map((e) => ({ id: e.id, name: e.name }))
  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }))

  const columns = [
    ...departments.map((d) => ({ id: d.id, name: d.name })),
    { id: "none", name: t("hr.employees.noDepartment") },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("hr.employees.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("hr.employees.subtitle")}</p>
        </div>
        <EmployeeForm departments={departmentOptions} employees={employeeOptions} />
      </div>

      <div className="flex items-center justify-end">
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {columns.map((col) => {
            const items = employees.filter(
              (e) => (e.departmentId ?? "none") === col.id
            )
            return (
              <KanbanColumn key={col.id} title={col.name} count={items.length} accent="bg-orange-500">
                {items.map((e) => (
                  <KanbanCard key={e.id} href={`/hr/employees/${e.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{e.name}</span>
                      {!e.active && <Badge variant="destructive">{t("status.archived")}</Badge>}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {e.jobTitle ?? "—"}
                    </p>
                    {e.workEmail && (
                      <p className="mt-2 truncate text-xs text-muted-foreground">{e.workEmail}</p>
                    )}
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("hr.employees.jobTitle")}</TableHead>
              <TableHead>{t("hr.employees.department")}</TableHead>
              <TableHead>{t("hr.employees.manager")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Link href={`/hr/employees/${e.id}`} className="font-medium hover:underline">
                    {e.name}
                  </Link>
                </TableCell>
                <TableCell>{e.jobTitle ?? "—"}</TableCell>
                <TableCell>{e.department?.name ?? "—"}</TableCell>
                <TableCell>{e.manager?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={e.active ? "outline" : "destructive"}>
                    {e.active ? t("status.active") : t("status.archived")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("hr.employees.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
