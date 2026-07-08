import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DepartmentManager } from "@/components/hr/department-manager"
import { prisma } from "@/lib/prisma"

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="text-sm text-muted-foreground">
          Organize employees into departments.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Manage Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentManager
            departments={departments.map((d) => ({
              id: d.id,
              name: d.name,
              count: d._count.employees,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
