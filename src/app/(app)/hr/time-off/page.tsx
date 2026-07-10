import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TimeOffForm } from "@/components/hr/time-off-form"
import { TimeOffActions } from "@/components/hr/time-off-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["DRAFT", "APPROVED", "REFUSED"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  APPROVED: "default",
  REFUSED: "destructive",
}

export default async function TimeOffPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, requests, employees] = await Promise.all([
    prisma.timeOff.count({ where }),
    prisma.timeOff.findMany({
      where,
      include: { employee: true },
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
          <h1 className="text-2xl font-semibold">{t("timeOff.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("timeOff.subtitle")}</p>
        </div>
        <TimeOffForm employees={employees} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.employee")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("common.from")}</TableHead>
            <TableHead>{t("common.to")}</TableHead>
            <TableHead className="text-right">{t("timeOff.days")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.employee.name}</TableCell>
              <TableCell>{t(`timeoffType.${r.type}`)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.startDate.toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.endDate.toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">{r.days}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[r.status] ?? "outline"}>
                  {t(`status.${r.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <TimeOffActions id={r.id} status={r.status} />
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {activeStatus ? t("timeOff.emptyStatus") : t("timeOff.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
