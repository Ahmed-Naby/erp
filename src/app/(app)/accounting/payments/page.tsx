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
import { getTranslations } from "@/lib/i18n/server"

export default async function PaymentsPage() {
  const { t } = await getTranslations()
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
        <h1 className="text-2xl font-semibold">{t("accounting.payments.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("accounting.payments.subtitle")}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("accounting.payments.number")}</TableHead>
            <TableHead>{t("accounting.payments.type")}</TableHead>
            <TableHead>{t("accounting.payments.reference")}</TableHead>
            <TableHead className="text-right">{t("invoices.amount")}</TableHead>
            <TableHead>{t("invoices.method")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.paymentNumber}</TableCell>
              <TableCell>
                <Badge variant={p.type === "RECEIVED" ? "default" : "secondary"}>
                  {t(`status.${p.type}`)}
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
                {t("accounting.payments.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
