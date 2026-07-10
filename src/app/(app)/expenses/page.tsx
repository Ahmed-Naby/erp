import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { ExpenseActions } from "@/components/expenses/expense-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REFUSED", "POSTED"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "secondary",
  REFUSED: "destructive",
  POSTED: "default",
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, expenses, employees] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
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
          <h1 className="text-2xl font-semibold">{t("expenses.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("expenses.subtitle")}</p>
        </div>
        <ExpenseForm employees={employees} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.employee")}</TableHead>
            <TableHead>{t("expenses.description")}</TableHead>
            <TableHead>{t("expenses.category")}</TableHead>
            <TableHead className="text-right">{t("expenses.amount")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.employee.name}</TableCell>
              <TableCell>{e.description}</TableCell>
              <TableCell>{t(`expenseCategory.${e.category}`)}</TableCell>
              <TableCell className="text-right">{e.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[e.status] ?? "outline"}>{t(`status.${e.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <ExpenseActions id={e.id} status={e.status} />
              </TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {activeStatus ? t("expenses.emptyStatus") : t("expenses.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
