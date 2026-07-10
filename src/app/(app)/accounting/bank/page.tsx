import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { BankLineForm } from "@/components/accounting/bank-line-form"
import { BankLineActions } from "@/components/accounting/bank-line-actions"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function BankReconciliationPage() {
  const { t } = await getTranslations()

  const [lines, payments] = await Promise.all([
    prisma.bankStatementLine.findMany({
      orderBy: { date: "desc" },
      include: { payment: true },
    }),
    prisma.payment.findMany({
      where: { statementLine: null },
      orderBy: { date: "desc" },
      select: { id: true, paymentNumber: true, type: true, amount: true },
    }),
  ])

  const paymentOptions = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    label: `${p.paymentNumber} · ${t(`accounting.payments.${p.type === "RECEIVED" ? "received" : "paid"}`)} · ${p.amount.toFixed(2)}`,
  }))

  const bankBalance = lines.reduce((s, l) => s + l.amount, 0)
  const reconciledCount = lines.filter((l) => l.reconciled).length
  const unreconciledCount = lines.length - reconciledCount
  const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("bank.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("bank.subtitle")}</p>
        </div>
        <BankLineForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("bank.bankBalance")} value={nf.format(bankBalance)} />
        <SummaryCard label={t("bank.reconciled")} value={String(reconciledCount)} />
        <SummaryCard label={t("bank.unreconciled")} value={String(unreconciledCount)} />
        <SummaryCard label={t("bank.unmatchedPayments")} value={String(payments.length)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("bank.description")}</TableHead>
            <TableHead className="text-right">{t("bank.amount")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("bank.matchedPayment")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="whitespace-nowrap text-sm">{l.date.toISOString().slice(0, 10)}</TableCell>
              <TableCell>{l.description}</TableCell>
              <TableCell className={`text-right ${l.amount < 0 ? "text-rose-600" : ""}`}>{nf.format(l.amount)}</TableCell>
              <TableCell>
                <Badge variant={l.reconciled ? "default" : "outline"}>
                  {l.reconciled ? t("bank.statusReconciled") : t("bank.statusUnreconciled")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{l.payment?.paymentNumber ?? "—"}</TableCell>
              <TableCell>
                <BankLineActions
                  lineId={l.id}
                  reconciled={l.reconciled}
                  lineAmount={l.amount}
                  payments={paymentOptions}
                />
              </TableCell>
            </TableRow>
          ))}
          {lines.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {t("bank.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
