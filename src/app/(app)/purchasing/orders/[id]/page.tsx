import Link from "next/link"
import { notFound } from "next/navigation"

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
import { StatusBar } from "@/components/shared/status-bar"
import { Chatter } from "@/components/shared/chatter"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getTranslations()
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.poNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.supplier.name} &middot; {order.warehouse.name} &middot;{" "}
            {order.orderDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBar
            stages={["DRAFT", "SENT", "RECEIVED"]}
            current={order.status}
            exceptionStatus="CANCELLED"
          />
          <div className="flex gap-2">
            <PrintButton />
            <div className="flex gap-2 print:hidden">
              {order.status === "DRAFT" && (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/purchasing/orders/${order.id}/edit`} />}
                >
                  {t("common.edit")}
                </Button>
              )}
              {order.status === "RECEIVED" && (
                <PaymentForm targetType="purchaseOrder" targetId={order.id} amountDue={due} />
              )}
              <PoActions orderId={order.id} status={order.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {order.status === "RECEIVED" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("invoices.paymentStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {t("invoices.paidOf", {
                  paid: order.paidAmount.toFixed(2),
                  total: total.toFixed(2),
                  due: due.toFixed(2),
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("purchaseOrders.lineItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("stockMovements.product")}</TableHead>
                    <TableHead className="text-right">{t("common.quantity")}</TableHead>
                    <TableHead className="text-right">{t("purchaseOrders.unitCost")}</TableHead>
                    <TableHead className="text-right">{t("products.taxRate")}</TableHead>
                    <TableHead className="text-right">{t("purchaseOrders.lineTotal")}</TableHead>
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
                      {t("common.subtotal")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                      {t("common.tax")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tax.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      {t("common.total")}
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
                <CardTitle>{t("common.notes")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{order.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 print:hidden">
          <Chatter
            entityType="PurchaseOrder"
            entityId={order.id}
            createdAt={order.createdAt}
            createdLabel={t("purchaseOrders.createdLabel", { number: order.poNumber })}
          />
        </div>
      </div>
    </div>
  )
}
