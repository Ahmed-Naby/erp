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

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
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
    { id: "none", name: "No Department" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">Your team directory.</p>
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
                      {!e.active && <Badge variant="destructive">Archived</Badge>}
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
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
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
                    {e.active ? "Active" : "Archived"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No employees yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
