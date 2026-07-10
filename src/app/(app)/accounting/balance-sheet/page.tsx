import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountBalances, parseDateRange } from "@/services/ledger"
import { getTranslations } from "@/lib/i18n/server"

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>
}) {
  const { to } = await searchParams
  const { t } = await getTranslations()
  const rows = await accountBalances(parseDateRange({ to }))

  const assets = rows.filter((r) => r.type === "ASSET")
  const liabilities = rows.filter((r) => r.type === "LIABILITY")
  const equity = rows.filter((r) => r.type === "EQUITY")

  const sum = (rs: typeof rows) => rs.reduce((s, r) => s + r.balance, 0)
  const revenue = sum(rows.filter((r) => r.type === "REVENUE"))
  const expenses = sum(rows.filter((r) => r.type === "EXPENSE"))
  const netIncome = revenue - expenses

  const totalAssets = sum(assets)
  const totalLiabilities = sum(liabilities)
  const totalEquity = sum(equity) + netIncome
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("balanceSheet.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("balanceSheet.subtitle")}</p>
        </div>
        <form method="get" action="/accounting/balance-sheet" className="flex items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t("balanceSheet.asOf")}</span>
            <Input type="date" name="to" defaultValue={to} className="w-40" />
          </label>
          <Button type="submit" variant="outline">{t("reports.apply")}</Button>
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section label={t("balanceSheet.assets")} rs={assets} />
        <div className="space-y-8">
          <Section label={t("balanceSheet.liabilities")} rs={liabilities} />
          <Section
            label={t("balanceSheet.equity")}
            rs={equity}
            extra={{ label: t("balanceSheet.currentEarnings"), amount: netIncome }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 border-t pt-4">
        <Total label={t("balanceSheet.totalAssets")} amount={totalAssets} strong />
        <Total label={t("balanceSheet.totalLiabilities")} amount={totalLiabilities} />
        <Total label={t("balanceSheet.totalEquity")} amount={totalEquity} />
      </div>

      {!balanced && (
        <Badge variant="destructive">{t("balanceSheet.unbalanced")}</Badge>
      )}
    </div>
  )
}

type SheetRow = { code: string; name: string; balance: number }

function Section({
  label,
  rs,
  extra,
}: {
  label: string
  rs: SheetRow[]
  extra?: { label: string; amount: number }
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-medium">{label}</h2>
      <Table>
        <TableBody>
          {rs.map((r) => (
            <TableRow key={r.code}>
              <TableCell>
                <span className="font-mono text-sm text-muted-foreground">{r.code}</span> {r.name}
              </TableCell>
              <TableCell className="text-right">{r.balance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {extra && (
            <TableRow>
              <TableCell className="text-muted-foreground">{extra.label}</TableCell>
              <TableCell className="text-right">{extra.amount.toFixed(2)}</TableCell>
            </TableRow>
          )}
          {rs.length === 0 && !extra && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">—</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function Total({ label, amount, strong }: { label: string; amount: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={strong ? "text-xl font-semibold" : "text-lg font-medium"}>{amount.toFixed(2)}</span>
    </div>
  )
}
