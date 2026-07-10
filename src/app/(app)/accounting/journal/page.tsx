import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/shared/pagination"
import { ManualJournalForm } from "@/components/accounting/manual-journal-form"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()
  const [total, entries, accounts] = await Promise.all([
    prisma.journalEntry.count(),
    prisma.journalEntry.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { date: "desc" },
      ...pageArgs(page),
    }),
    prisma.account.findMany({ orderBy: { code: "asc" }, select: { code: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("accounting.journal.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("accounting.journal.subtitle")}</p>
        </div>
        <ManualJournalForm accounts={accounts} />
      </div>

      <div className="space-y-4">
        {entries.map((entry) => {
          const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0)
          return (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {entry.entryNumber}
                    {entry.source === "MANUAL" && (
                      <Badge variant="secondary">{t("manualJournal.manual")}</Badge>
                    )}
                    {entry.memo ? ` — ${entry.memo}` : ""}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {entry.date.toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("accounting.journal.account")}</TableHead>
                      <TableHead className="text-right">{t("accounting.journal.debit")}</TableHead>
                      <TableHead className="text-right">{t("accounting.journal.credit")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          {line.account.code} &middot; {line.account.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.debit > 0 ? line.debit.toFixed(2) : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.credit > 0 ? line.credit.toFixed(2) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium">{t("common.total")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {totalDebit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalDebit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
        {entries.length === 0 && (
          <p className="text-center text-muted-foreground">{t("accounting.journal.empty")}</p>
        )}
      </div>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
