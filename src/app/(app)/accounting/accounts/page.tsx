import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

const debitNormalTypes = new Set(["ASSET", "EXPENSE"])

export default async function ChartOfAccountsPage() {
  const { t } = await getTranslations()
  const accounts = await prisma.account.findMany({
    include: { journalLines: true },
    orderBy: { code: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("accounting.accounts.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("accounting.accounts.subtitle")}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("accounting.accounts.code")}</TableHead>
            <TableHead>{t("accounting.accounts.accountName")}</TableHead>
            <TableHead>{t("accounting.accounts.accountType")}</TableHead>
            <TableHead className="text-right">{t("common.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => {
            const totalDebit = a.journalLines.reduce((sum, l) => sum + l.debit, 0)
            const totalCredit = a.journalLines.reduce((sum, l) => sum + l.credit, 0)
            const balance = debitNormalTypes.has(a.type)
              ? totalDebit - totalCredit
              : totalCredit - totalDebit
            return (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-sm">{a.code}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{a.type}</Badge>
                </TableCell>
                <TableCell className="text-right">{balance.toFixed(2)}</TableCell>
              </TableRow>
            )
          })}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("accounting.journal.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
