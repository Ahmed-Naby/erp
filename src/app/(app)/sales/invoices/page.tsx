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
import { PaymentForm } from "@/components/accounting/payment-form"
import { prisma } from "@/lib/prisma"

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, salesOrder: true },
    orderBy: { issuedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Invoices generated from confirmed sales orders.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const due = inv.totalAmount - inv.paidAmount
            return (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/invoices/${inv.id}`} className="hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{inv.customer.name}</TableCell>
                <TableCell>
                  <Link href={`/sales/orders/${inv.salesOrderId}`} className="hover:underline">
                    {inv.salesOrder.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={inv.status === "PAID" ? "default" : "outline"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{inv.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">{due.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {inv.issuedAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <PaymentForm targetType="invoice" targetId={inv.id} amountDue={due} />
                </TableCell>
              </TableRow>
            )
          })}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No invoices yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
