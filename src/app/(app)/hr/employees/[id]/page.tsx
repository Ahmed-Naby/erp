import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeForm } from "@/components/hr/employee-form"
import { EmployeeActiveToggle } from "@/components/hr/employee-active-toggle"
import { prisma } from "@/lib/prisma"

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, manager: true, reports: { orderBy: { name: "asc" } } },
  })
  if (!employee) notFound()

  const [departments, employees] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{employee.name}</h1>
            <Badge variant={employee.active ? "outline" : "destructive"}>
              {employee.active ? "Active" : "Archived"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{employee.jobTitle ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <EmployeeForm
            mode="edit"
            employeeId={employee.id}
            triggerVariant="outline"
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            employees={employees}
            defaultValues={{
              name: employee.name,
              jobTitle: employee.jobTitle ?? "",
              workEmail: employee.workEmail ?? "",
              workPhone: employee.workPhone ?? "",
              departmentId: employee.departmentId ?? "none",
              managerId: employee.managerId ?? "none",
              hireDate: employee.hireDate
                ? employee.hireDate.toISOString().slice(0, 10)
                : "",
            }}
          />
          <EmployeeActiveToggle id={employee.id} active={employee.active} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Department" value={employee.department?.name ?? null} />
            <Field label="Manager" value={employee.manager?.name ?? null} />
            <Field label="Work Email" value={employee.workEmail} />
            <Field label="Work Phone" value={employee.workPhone} />
            <Field
              label="Hire Date"
              value={employee.hireDate ? employee.hireDate.toLocaleDateString() : null}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Direct Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {employee.reports.length === 0 && (
              <p className="text-muted-foreground">No direct reports.</p>
            )}
            {employee.reports.map((r) => (
              <Link
                key={r.id}
                href={`/hr/employees/${r.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.jobTitle ?? "—"}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  )
}
