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
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()
  const [total, invoices] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.findMany({
      include: { customer: true, salesOrder: true },
      orderBy: { issuedAt: "desc" },
      ...pageArgs(page),
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("invoices.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("invoices.subtitle")}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("invoices.invoiceNumber")}</TableHead>
            <TableHead>{t("invoices.customer")}</TableHead>
            <TableHead>{t("nav.orders")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("invoices.amount")}</TableHead>
            <TableHead className="text-right">{t("invoices.due")}</TableHead>
            <TableHead>{t("invoices.issued")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                    {t(`status.${inv.status}`)}
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
                {t("invoices.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
