import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const [
    stockItems,
    openSalesOrders,
    openPurchaseOrders,
    unpaidInvoices,
    receivedPurchaseOrders,
    products,
  ] = await Promise.all([
    prisma.stockItem.findMany({ include: { product: true } }),
    prisma.salesOrder.count({ where: { status: { in: ["DRAFT", "CONFIRMED"] } } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.invoice.findMany({ where: { status: "UNPAID" } }),
    prisma.purchaseOrder.findMany({
      where: { status: "RECEIVED" },
      include: { lines: true },
    }),
    prisma.product.findMany({
      where: { active: true, reorderLevel: { gt: 0 } },
      include: { stockItems: true },
    }),
  ])

  const stockValue = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.product.costPrice,
    0
  )

  const accountsReceivable = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
    0
  )

  const accountsPayable = receivedPurchaseOrders.reduce((sum, po) => {
    const { total } = computeTotals(
      po.lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))
    )
    return sum + (total - po.paidAmount)
  }, 0)

  const lowStockProducts = products
    .map((p) => ({
      ...p,
      totalStock: p.stockItems.reduce((s, si) => s + si.quantity, 0),
    }))
    .filter((p) => p.totalStock <= p.reorderLevel)

  const stats = [
    { label: "Stock Value", value: stockValue.toFixed(2) },
    { label: "Open Sales Orders", value: String(openSalesOrders) },
    { label: "Open Purchase Orders", value: String(openPurchaseOrders) },
    { label: "Accounts Receivable", value: accountsReceivable.toFixed(2) },
    { label: "Accounts Payable", value: accountsPayable.toFixed(2) },
    { label: "Low Stock Items", value: String(lowStockProducts.length) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of inventory, sales, purchasing and accounting.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Low Stock Alerts</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Reorder Level</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lowStockProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-right">{p.totalStock}</TableCell>
                <TableCell className="text-right">{p.reorderLevel}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive">Low</Badge>
                </TableCell>
              </TableRow>
            ))}
            {lowStockProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No products are below their reorder level.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/inventory/products" className="text-muted-foreground hover:underline">
          View products
        </Link>
        <span className="text-muted-foreground">&middot;</span>
        <Link href="/sales/orders" className="text-muted-foreground hover:underline">
          View sales orders
        </Link>
        <span className="text-muted-foreground">&middot;</span>
        <Link href="/purchasing/orders" className="text-muted-foreground hover:underline">
          View purchase orders
        </Link>
        <span className="text-muted-foreground">&middot;</span>
        <Link href="/accounting/reports" className="text-muted-foreground hover:underline">
          View reports
        </Link>
      </div>
    </div>
  )
}
