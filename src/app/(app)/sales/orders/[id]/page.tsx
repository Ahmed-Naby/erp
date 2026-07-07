import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { OrderActions } from "@/components/sales/order-actions"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  INVOICED: "default",
  CANCELLED: "destructive",
}

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      warehouse: true,
      lines: { include: { product: true } },
      invoice: true,
    },
  })

  if (!order) notFound()

  const { subtotal, tax, total } = computeTotals(
    order.lines.map((l) => ({ amount: l.quantity * l.unitPrice, taxRate: l.taxRate }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <Badge variant={statusVariant[order.status] ?? "outline"}>{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customer.name} &middot; {order.warehouse.name} &middot;{" "}
            {order.orderDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {order.status === "DRAFT" && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/sales/orders/${order.id}/edit`} />}
            >
              Edit
            </Button>
          )}
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>

      {order.invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href={`/sales/invoices/${order.invoice.id}`} className="hover:underline">
              {order.invoice.invoiceNumber}
            </Link>{" "}
            &middot; {order.invoice.status} &middot; {order.invoice.totalAmount.toFixed(2)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => {
                const { total: lineTotal } = computeTotals([
                  { amount: line.quantity * line.unitPrice, taxRate: line.taxRate },
                ])
                return (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{line.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{line.taxRate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={4} className="text-right text-muted-foreground">
                  Subtotal
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {subtotal.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right text-muted-foreground">
                  Tax
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {tax.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium">{total.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{order.notes}</CardContent>
        </Card>
      )}
    </div>
  )
}
