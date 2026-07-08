import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContactForm } from "@/components/contacts/contact-form"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

type Translate = (key: string, vars?: Record<string, string | number>) => string

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  const { t } = await getTranslations()
  if (kind !== "customer" && kind !== "vendor") notFound()

  if (kind === "customer") {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesOrders: { include: { lines: true }, orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { issuedAt: "desc" } },
      },
    })
    if (!customer) notFound()

    return (
      <ContactShell
        t={t}
        kind="customer"
        id={customer.id}
        name={customer.name}
        email={customer.email}
        phone={customer.phone}
        address={customer.address}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("contacts.salesOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DocTable
              t={t}
              rows={customer.salesOrders.map((o) => ({
                href: `/sales/orders/${o.id}`,
                number: o.orderNumber,
                status: o.status,
                date: o.orderDate,
                total: computeTotals(
                  o.lines.map((l) => ({ amount: l.quantity * l.unitPrice, taxRate: l.taxRate }))
                ).total,
              }))}
              emptyLabel={t("contacts.noSalesOrders")}
            />
          </CardContent>
        </Card>
      </ContactShell>
    )
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { purchaseOrders: { include: { lines: true }, orderBy: { createdAt: "desc" } } },
  })
  if (!supplier) notFound()

  return (
    <ContactShell
      t={t}
      kind="vendor"
      id={supplier.id}
      name={supplier.name}
      email={supplier.email}
      phone={supplier.phone}
      address={supplier.address}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("contacts.purchaseOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DocTable
            t={t}
            rows={supplier.purchaseOrders.map((o) => ({
              href: `/purchasing/orders/${o.id}`,
              number: o.poNumber,
              status: o.status,
              date: o.orderDate,
              total: computeTotals(
                o.lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))
              ).total,
            }))}
            emptyLabel={t("contacts.noPurchaseOrders")}
          />
        </CardContent>
      </Card>
    </ContactShell>
  )
}

function ContactShell({
  t,
  kind,
  id,
  name,
  email,
  phone,
  address,
  children,
}: {
  t: Translate
  kind: "customer" | "vendor"
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <Badge variant={kind === "customer" ? "default" : "secondary"}>
              {kind === "customer" ? t("kind.customer") : t("kind.vendor")}
            </Badge>
          </div>
        </div>
        <ContactForm
          mode="edit"
          contactId={id}
          kind={kind}
          triggerVariant="outline"
          defaultValues={{
            name,
            email: email ?? "",
            phone: phone ?? "",
            address: address ?? "",
            kind,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label={t("common.email")} value={email} />
            <Field label={t("common.phone")} value={phone} />
            <Field label={t("common.address")} value={address} />
          </CardContent>
        </Card>
        <div className="space-y-6 lg:col-span-2">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  )
}

function DocTable({
  t,
  rows,
  emptyLabel,
}: {
  t: Translate
  rows: { href: string; number: string; status: string; date: Date; total: number }[]
  emptyLabel: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("contacts.number")}</TableHead>
          <TableHead>{t("common.status")}</TableHead>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead className="text-right">{t("common.total")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.href}>
            <TableCell>
              <Link href={r.href} className="font-medium hover:underline">
                {r.number}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{t(`status.${r.status}`)}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.date.toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">{r.total.toFixed(2)}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              {emptyLabel}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
