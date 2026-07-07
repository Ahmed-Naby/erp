import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/prisma"

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: { include: { customer: true } },
      purchaseOrder: { include: { supplier: true } },
    },
    orderBy: { date: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Money received from customers and paid to suppliers.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Against</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.paymentNumber}</TableCell>
              <TableCell>
                <Badge variant={p.type === "RECEIVED" ? "default" : "secondary"}>
                  {p.type}
                </Badge>
              </TableCell>
              <TableCell>
                {p.invoice && (
                  <Link href="/sales/invoices" className="hover:underline">
                    {p.invoice.invoiceNumber} &middot; {p.invoice.customer.name}
                  </Link>
                )}
                {p.purchaseOrder && (
                  <Link href={`/purchasing/orders/${p.purchaseOrder.id}`} className="hover:underline">
                    {p.purchaseOrder.poNumber} &middot; {p.purchaseOrder.supplier.name}
                  </Link>
                )}
              </TableCell>
              <TableCell className="text-right">{p.amount.toFixed(2)}</TableCell>
              <TableCell>{p.method ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {p.date.toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No payments recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
