import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PayslipForm } from "@/components/hr/payslip-form"
import { PayslipActions } from "@/components/hr/payslip-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["DRAFT", "CONFIRMED", "PAID"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  PAID: "default",
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, payslips, employees] = await Promise.all([
    prisma.payslip.count({ where }),
    prisma.payslip.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, wage: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("payroll.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("payroll.subtitle")}</p>
        </div>
        <PayslipForm employees={employees} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.employee")}</TableHead>
            <TableHead>{t("payroll.period")}</TableHead>
            <TableHead className="text-right">{t("payroll.basicSalary")}</TableHead>
            <TableHead className="text-right">{t("payroll.allowances")}</TableHead>
            <TableHead className="text-right">{t("payroll.deductions")}</TableHead>
            <TableHead className="text-right">{t("payroll.net")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.map((p) => {
            const net = p.basicSalary + p.allowances - p.deductions
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.employee.name}</TableCell>
                <TableCell>{p.period}</TableCell>
                <TableCell className="text-right">{p.basicSalary.toFixed(2)}</TableCell>
                <TableCell className="text-right">{p.allowances.toFixed(2)}</TableCell>
                <TableCell className="text-right">{p.deductions.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">{net.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[p.status] ?? "outline"}>{t(`status.${p.status}`)}</Badge>
                </TableCell>
                <TableCell>
                  <PayslipActions id={p.id} status={p.status} />
                </TableCell>
              </TableRow>
            )
          })}
          {payslips.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                {activeStatus ? t("payroll.emptyStatus") : t("payroll.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
