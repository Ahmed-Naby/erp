import Link from "next/link"
import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentForm } from "@/components/accounting/payment-form"
import { PrintButton } from "@/components/shared/print-button"
import { StatusBar } from "@/components/shared/status-bar"
import { Chatter } from "@/components/shared/chatter"
import { prisma } from "@/lib/prisma"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      salesOrder: { include: { lines: { include: { product: true } } } },
      payments: { orderBy: { date: "desc" } },
    },
  })

  if (!invoice) notFound()

  const subtotal = invoice.totalAmount - invoice.taxAmount
  const due = invoice.totalAmount - invoice.paidAmount

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {invoice.customer.name} &middot;{" "}
            <Link href={`/sales/orders/${invoice.salesOrderId}`} className="hover:underline">
              {invoice.salesOrder.orderNumber}
            </Link>{" "}
            &middot; Issued {invoice.issuedAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBar stages={["UNPAID", "PAID"]} current={invoice.status} />
          <div className="flex gap-2">
            <PrintButton />
            <div className="print:hidden">
              {invoice.status !== "PAID" && (
                <PaymentForm targetType="invoice" targetId={invoice.id} amountDue={due} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                  {invoice.salesOrder.lines.map((line) => {
                    const amount = line.quantity * line.unitPrice
                    const lineTotal = amount * (1 + line.taxRate / 100)
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
                      {invoice.taxAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Paid {invoice.paidAmount.toFixed(2)} of {invoice.totalAmount.toFixed(2)} &middot; Due{" "}
              {due.toFixed(2)}
            </CardContent>
          </Card>

          {invoice.payments.length > 0 && (
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.paymentNumber}</TableCell>
                        <TableCell>{p.method ?? "—"}</TableCell>
                        <TableCell className="text-right">{p.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.date.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 print:hidden">
          <Chatter
            entityType="Invoice"
            entityId={invoice.id}
            createdAt={invoice.createdAt}
            createdLabel={`Invoice ${invoice.invoiceNumber} created`}
          />
        </div>
      </div>
    </div>
  )
}
