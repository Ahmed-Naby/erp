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
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function JournalPage() {
  const { t } = await getTranslations()
  const entries = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { date: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("accounting.journal.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("accounting.journal.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => {
          const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0)
          return (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    {entry.entryNumber}
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
    </div>
  )
}
