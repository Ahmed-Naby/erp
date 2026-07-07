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

const debitNormalTypes = new Set(["ASSET", "EXPENSE"])

export default async function ChartOfAccountsPage() {
  const accounts = await prisma.account.findMany({
    include: { journalLines: true },
    orderBy: { code: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Balances are computed from posted journal entries.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Balance</TableHead>
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
                No accounts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
