import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AttendanceForm } from "@/components/hr/attendance-form"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function AttendancesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()

  const [total, records, employees] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.findMany({
      include: { employee: true },
      orderBy: { checkIn: "desc" },
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
          <h1 className="text-2xl font-semibold">{t("attendances.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("attendances.subtitle")}</p>
        </div>
        <AttendanceForm employees={employees} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.employee")}</TableHead>
            <TableHead>{t("attendances.checkIn")}</TableHead>
            <TableHead>{t("attendances.checkOut")}</TableHead>
            <TableHead className="text-right">{t("attendances.hours")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((a) => {
            const hours = a.checkOut
              ? (a.checkOut.getTime() - a.checkIn.getTime()) / 3_600_000
              : null
            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.employee.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.checkIn.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.checkOut ? (
                    a.checkOut.toLocaleString()
                  ) : (
                    <Badge variant="secondary">{t("attendances.present")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{hours != null ? hours.toFixed(1) : "—"}</TableCell>
              </TableRow>
            )
          })}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("attendances.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
