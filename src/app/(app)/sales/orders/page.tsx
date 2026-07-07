import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  INVOICED: "default",
  CANCELLED: "destructive",
}

export default async function SalesOrdersPage() {
  const orders = await prisma.salesOrder.findMany({
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">
            Orders placed by customers.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/sales/orders/new" />}>
          New Order
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const { total } = computeTotals(
              o.lines.map((l) => ({ amount: l.quantity * l.unitPrice, taxRate: l.taxRate }))
            )
            return (
              <TableRow key={o.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/sales/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{o.customer.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[o.status] ?? "outline"}>{o.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{o.lines.length}</TableCell>
                <TableCell className="text-right">{total.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.orderDate.toLocaleDateString()}
                </TableCell>
              </TableRow>
            )
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No sales orders yet. Create your first one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
