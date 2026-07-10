import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { QualityForm } from "@/components/quality/quality-form"
import { QualityActions } from "@/components/quality/quality-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const STATUSES = ["PENDING", "PASS", "FAIL"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  PASS: "default",
  FAIL: "destructive",
}

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeStatus = status && STATUSES.includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, checks, products] = await Promise.all([
    prisma.qualityCheck.count({ where }),
    prisma.qualityCheck.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("quality.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("quality.subtitle")}</p>
        </div>
        <QualityForm products={products} />
      </div>

      <StatusFilter statuses={STATUSES} current={activeStatus} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("quality.checkTitle")}</TableHead>
            <TableHead>{t("quality.product")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checks.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.title}
                <QualityForm
                  mode="edit"
                  checkId={c.id}
                  products={products}
                  triggerVariant="ghost"
                  defaultValues={{
                    title: c.title,
                    productId: c.productId ?? "none",
                    note: c.note ?? "",
                  }}
                />
              </TableCell>
              <TableCell>{c.product?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[c.status] ?? "outline"}>{t(`status.${c.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <QualityActions id={c.id} status={c.status} />
              </TableCell>
            </TableRow>
          ))}
          {checks.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("quality.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
