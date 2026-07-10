import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PeriodLockForm } from "@/components/accounting/period-lock-form"
import { PeriodUnlock } from "@/components/accounting/period-unlock"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function PeriodsPage() {
  const { t } = await getTranslations()
  const locks = await prisma.periodLock.findMany({ orderBy: { period: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("periods.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("periods.subtitle")}</p>
        </div>
        <PeriodLockForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("periods.period")}</TableHead>
            <TableHead>{t("periods.note")}</TableHead>
            <TableHead>{t("periods.lockedOn")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locks.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">{l.period}</TableCell>
              <TableCell className="text-muted-foreground">{l.note ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{l.createdAt.toISOString().slice(0, 10)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <PeriodUnlock id={l.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {locks.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("periods.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
