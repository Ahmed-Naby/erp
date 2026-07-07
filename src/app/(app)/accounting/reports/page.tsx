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
import { ACCOUNT_CODES } from "@/lib/accounts"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

const AGING_BUCKETS = [
  { label: "0-30 days", min: 0, max: 30 },
  { label: "31-60 days", min: 31, max: 60 },
  { label: "61-90 days", min: 61, max: 90 },
  { label: "90+ days", min: 91, max: Infinity },
]

function bucketFor(days: number) {
  return AGING_BUCKETS.find((b) => days >= b.min && days <= b.max) ?? AGING_BUCKETS[AGING_BUCKETS.length - 1]
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

async function getAccountBalance(code: string, debitNormal: boolean) {
  const account = await prisma.account.findUnique({
    where: { code },
    include: { journalLines: true },
  })
  if (!account) return 0
  const totalDebit = account.journalLines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = account.journalLines.reduce((sum, l) => sum + l.credit, 0)
  return debitNormal ? totalDebit - totalCredit : totalCredit - totalDebit
}

export default async function ReportsPage() {
  const [
    stockItems,
    unpaidInvoices,
    unpaidPurchaseOrders,
    revenue,
    cogs,
    taxPayable,
    taxReceivable,
  ] = await Promise.all([
    prisma.stockItem.findMany({ include: { product: true } }),
    prisma.invoice.findMany({
      where: { status: "UNPAID" },
      include: { customer: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: "RECEIVED" },
      include: { lines: true, supplier: true },
    }),
    getAccountBalance(ACCOUNT_CODES.SALES_REVENUE, false),
    getAccountBalance(ACCOUNT_CODES.COST_OF_GOODS_SOLD, true),
    getAccountBalance(ACCOUNT_CODES.TAX_PAYABLE, false),
    getAccountBalance(ACCOUNT_CODES.TAX_RECEIVABLE, true),
  ])

  const stockValuation = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.product.costPrice,
    0
  )

  const arAging = AGING_BUCKETS.map((b) => ({ ...b, total: 0 }))
  for (const inv of unpaidInvoices) {
    const due = inv.totalAmount - inv.paidAmount
    if (due <= 0) continue
    const bucket = bucketFor(daysSince(inv.issuedAt))
    const target = arAging.find((b) => b.label === bucket.label)!
    target.total += due
  }

  const apAging = AGING_BUCKETS.map((b) => ({ ...b, total: 0 }))
  for (const po of unpaidPurchaseOrders) {
    const { total } = computeTotals(
      po.lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))
    )
    const due = total - po.paidAmount
    if (due <= 0) continue
    const bucket = bucketFor(daysSince(po.orderDate))
    const target = apAging.find((b) => b.label === bucket.label)!
    target.total += due
  }

  const netIncome = revenue - cogs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Stock valuation, profit &amp; loss, and receivables/payables aging.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Valuation</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {stockValuation.toFixed(2)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit &amp; Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Sales Revenue</TableCell>
                <TableCell className="text-right">{revenue.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cost of Goods Sold</TableCell>
                <TableCell className="text-right">({cogs.toFixed(2)})</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Net Income</TableCell>
                <TableCell className="text-right font-medium">{netIncome.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Tax Payable (output VAT on sales)</TableCell>
                <TableCell className="text-right">{taxPayable.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tax Receivable (input VAT on purchases)</TableCell>
                <TableCell className="text-right">{taxReceivable.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Net Tax Due</TableCell>
                <TableCell className="text-right font-medium">
                  {(taxPayable - taxReceivable).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {arAging.map((b) => (
                  <TableHead key={b.label} className="text-right">
                    {b.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {arAging.map((b) => (
                  <TableCell key={b.label} className="text-right">
                    {b.total.toFixed(2)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts Payable Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {apAging.map((b) => (
                  <TableHead key={b.label} className="text-right">
                    {b.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {apAging.map((b) => (
                  <TableCell key={b.label} className="text-right">
                    {b.total.toFixed(2)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
