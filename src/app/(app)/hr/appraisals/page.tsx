import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AppraisalForm } from "@/components/hr/appraisal-form"
import { AppraisalActions } from "@/components/hr/appraisal-actions"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function AppraisalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()

  const [total, appraisals, employees] = await Promise.all([
    prisma.appraisal.count(),
    prisma.appraisal.findMany({
      include: { employee: true },
      orderBy: { date: "desc" },
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
          <h1 className="text-2xl font-semibold">{t("appraisals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("appraisals.subtitle")}</p>
        </div>
        <AppraisalForm employees={employees} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.employee")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("appraisals.rating")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appraisals.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                {a.employee.name}
                <AppraisalForm
                  mode="edit"
                  appraisalId={a.id}
                  employees={employees}
                  triggerVariant="ghost"
                  defaultValues={{
                    employeeId: a.employeeId,
                    date: a.date.toISOString().slice(0, 10),
                    rating: a.rating != null ? String(a.rating) : "none",
                    feedback: a.feedback ?? "",
                  }}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {a.date.toLocaleDateString()}
              </TableCell>
              <TableCell>{a.rating != null ? `${a.rating} / 5` : "—"}</TableCell>
              <TableCell>
                <Badge variant={a.status === "DONE" ? "default" : "outline"}>
                  {t(`status.${a.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <AppraisalActions id={a.id} status={a.status} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {appraisals.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("appraisals.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
