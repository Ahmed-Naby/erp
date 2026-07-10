import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DateRangeFilter } from "@/components/accounting/date-range-filter"
import { accountBalances, parseDateRange } from "@/services/ledger"
import { getTranslations } from "@/lib/i18n/server"

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const { t } = await getTranslations()
  const rows = await accountBalances(parseDateRange({ from, to }))

  // Each account's net lands on its normal side; a correct ledger balances.
  const totalDebit = rows.reduce((s, r) => s + (r.debit > r.credit ? r.debit - r.credit : 0), 0)
  const totalCredit = rows.reduce((s, r) => s + (r.credit > r.debit ? r.credit - r.debit : 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("trialBalance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("trialBalance.subtitle")}</p>
        </div>
        <DateRangeFilter from={from} to={to} action="/accounting/trial-balance" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("accounting.accounts.code")}</TableHead>
            <TableHead>{t("accounting.accounts.accountName")}</TableHead>
            <TableHead className="text-right">{t("accounting.journal.debit")}</TableHead>
            <TableHead className="text-right">{t("accounting.journal.credit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const debit = r.debit > r.credit ? r.debit - r.credit : 0
            const credit = r.credit > r.debit ? r.credit - r.debit : 0
            return (
              <TableRow key={r.code}>
                <TableCell className="font-mono text-sm">{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-right">{debit > 0 ? debit.toFixed(2) : ""}</TableCell>
                <TableCell className="text-right">{credit > 0 ? credit.toFixed(2) : ""}</TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("trialBalance.empty")}
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={2} className="font-medium">
              {t("common.total")}
              {!balanced && (
                <Badge variant="destructive" className="ms-2">{t("trialBalance.unbalanced")}</Badge>
              )}
            </TableCell>
            <TableCell className="text-right font-semibold">{totalDebit.toFixed(2)}</TableCell>
            <TableCell className="text-right font-semibold">{totalCredit.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
