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
import { OrderActions } from "@/components/sales/order-actions"
import { StatusBar } from "@/components/shared/status-bar"
import { Chatter } from "@/components/shared/chatter"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getTranslations()
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.customer.name} &middot; {order.warehouse.name} &middot;{" "}
            {order.orderDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBar
            stages={["DRAFT", "CONFIRMED", "INVOICED"]}
            current={order.status}
            exceptionStatus="CANCELLED"
          />
          <div className="flex gap-2">
            {order.status === "DRAFT" && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/sales/orders/${order.id}/edit`} />}
              >
                {t("common.edit")}
              </Button>
            )}
            <OrderActions orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {order.invoice && (
            <Card>
              <CardHeader>
                <CardTitle>{t("salesOrders.invoice")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Link href={`/sales/invoices/${order.invoice.id}`} className="hover:underline">
                  {order.invoice.invoiceNumber}
                </Link>{" "}
                &middot; {t(`status.${order.invoice.status}`)} &middot;{" "}
                {order.invoice.totalAmount.toFixed(2)}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("salesOrders.lineItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("stockMovements.product")}</TableHead>
                    <TableHead className="text-right">{t("common.quantity")}</TableHead>
                    <TableHead className="text-right">{t("salesOrders.unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("products.taxRate")}</TableHead>
                    <TableHead className="text-right">{t("salesOrders.lineTotal")}</TableHead>
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

        <div className="lg:col-span-1">
          <Chatter
            entityType="SalesOrder"
            entityId={order.id}
            createdAt={order.createdAt}
            createdLabel={t("salesOrders.createdLabel", { number: order.orderNumber })}
          />
        </div>
      </div>
    </div>
  )
}
