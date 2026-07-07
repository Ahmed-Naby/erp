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
import { PoActions } from "@/components/purchasing/po-actions"
import { PaymentForm } from "@/components/accounting/payment-form"
import { PrintButton } from "@/components/shared/print-button"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  RECEIVED: "default",
  CANCELLED: "destructive",
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      lines: { include: { product: true } },
    },
  })

  if (!order) notFound()

  const { subtotal, tax, total } = computeTotals(
    order.lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))
  )
  const due = total - order.paidAmount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.poNumber}</h1>
            <Badge variant={statusVariant[order.status] ?? "outline"}>{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.supplier.name} &middot; {order.warehouse.name} &middot;{" "}
            {order.orderDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <div className="flex gap-2 print:hidden">
            {order.status === "DRAFT" && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/purchasing/orders/${order.id}/edit`} />}
              >
                Edit
              </Button>
            )}
            {order.status === "RECEIVED" && (
              <PaymentForm targetType="purchaseOrder" targetId={order.id} amountDue={due} />
            )}
            <PoActions orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>

      {order.status === "RECEIVED" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Paid {order.paidAmount.toFixed(2)} of {total.toFixed(2)} &middot; Due {due.toFixed(2)}
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
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => {
                const { total: lineTotal } = computeTotals([
                  { amount: line.quantity * line.unitCost, taxRate: line.taxRate },
                ])
                return (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{line.unitCost.toFixed(2)}</TableCell>
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
