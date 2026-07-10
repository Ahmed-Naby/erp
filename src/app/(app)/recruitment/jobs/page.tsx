import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { JobPositionForm } from "@/components/recruitment/job-position-form"
import { JobOpenToggle } from "@/components/recruitment/job-open-toggle"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function JobPositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()

  const [total, positions, departments] = await Promise.all([
    prisma.jobPosition.count(),
    prisma.jobPosition.findMany({
      include: { department: true, _count: { select: { applicants: true } } },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ])

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("jobs.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("jobs.subtitle")}</p>
        </div>
        <JobPositionForm departments={departmentOptions} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("jobs.position")}</TableHead>
            <TableHead>{t("hr.employees.department")}</TableHead>
            <TableHead>{t("jobs.state")}</TableHead>
            <TableHead className="text-right">{t("jobs.applicantsCount")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.title}</TableCell>
              <TableCell>{p.department?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={p.isOpen ? "default" : "secondary"}>
                  {p.isOpen ? t("jobs.open") : t("jobs.closed")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{p._count.applicants}</TableCell>
              <TableCell className="text-right space-x-2">
                <JobPositionForm
                  mode="edit"
                  positionId={p.id}
                  departments={departmentOptions}
                  defaultValues={{
                    title: p.title,
                    departmentId: p.departmentId ?? "none",
                    description: p.description ?? "",
                  }}
                />
                <JobOpenToggle id={p.id} isOpen={p.isOpen} />
              </TableCell>
            </TableRow>
          ))}
          {positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("jobs.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
