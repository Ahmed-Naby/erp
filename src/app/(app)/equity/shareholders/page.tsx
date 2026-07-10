import Link from "next/link"

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
import { ShareholderForm } from "@/components/equity/shareholder-form"
import { ShareholderDelete, HoldingDelete } from "@/components/equity/shareholder-delete"
import { IssueSharesForm } from "@/components/equity/issue-shares-form"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function ShareholdersPage() {
  const { t } = await getTranslations()

  const [shareholders, shareClasses] = await Promise.all([
    prisma.shareholder.findMany({
      orderBy: { name: "asc" },
      include: { holdings: { include: { shareClass: true }, orderBy: { issueDate: "desc" } } },
    }),
    prisma.shareClass.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  const holdings = shareholders.flatMap((s) =>
    s.holdings.map((h) => ({ ...h, shareholderName: s.name }))
  )
  const grandTotalShares = holdings.reduce((sum, h) => sum + h.shares, 0)
  const totalRaised = holdings.reduce((sum, h) => sum + h.shares * h.pricePerShare, 0)

  const rows = shareholders
    .map((s) => {
      const totalShares = s.holdings.reduce((sum, h) => sum + h.shares, 0)
      return {
        ...s,
        totalShares,
        ownership: grandTotalShares > 0 ? (totalShares / grandTotalShares) * 100 : 0,
      }
    })
    .sort((a, b) => b.totalShares - a.totalShares)

  const shareholderOptions = shareholders.map((s) => ({ id: s.id, name: s.name }))
  const nf = new Intl.NumberFormat("en-US")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("shareholders.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("shareholders.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <IssueSharesForm
            shareholders={shareholderOptions}
            shareClasses={shareClasses}
            triggerVariant="outline"
          />
          <ShareholderForm />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("shareholders.totalShares")} value={nf.format(grandTotalShares)} />
        <SummaryCard label={t("shareholders.count")} value={nf.format(shareholders.length)} />
        <SummaryCard label={t("shareClasses.title")} value={nf.format(shareClasses.length)} />
        <SummaryCard label={t("shareholders.totalRaised")} value={nf.format(Math.round(totalRaised))} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">{t("shareholders.capTable")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("shareholders.type")}</TableHead>
              <TableHead className="text-right">{t("shareholders.shares")}</TableHead>
              <TableHead className="text-right">{t("shareholders.ownership")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.name}
                  {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`shareholderType.${s.type}`)}</Badge>
                </TableCell>
                <TableCell className="text-right">{nf.format(s.totalShares)}</TableCell>
                <TableCell className="text-right">{s.ownership.toFixed(1)}%</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <IssueSharesForm
                      shareholders={shareholderOptions}
                      shareClasses={shareClasses}
                      presetShareholderId={s.id}
                      triggerVariant="ghost"
                      triggerLabel={t("shareholders.issue")}
                    />
                    <ShareholderForm
                      mode="edit"
                      shareholderId={s.id}
                      triggerVariant="ghost"
                      defaultValues={{ name: s.name, email: s.email ?? "", type: s.type as "INDIVIDUAL" | "ENTITY" }}
                    />
                    <ShareholderDelete id={s.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("shareholders.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">{t("shareholders.issuances")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("shareholders.shareholder")}</TableHead>
              <TableHead>{t("shareholders.shareClass")}</TableHead>
              <TableHead className="text-right">{t("shareholders.shares")}</TableHead>
              <TableHead className="text-right">{t("shareholders.pricePerShare")}</TableHead>
              <TableHead className="text-right">{t("shareholders.value")}</TableHead>
              <TableHead>{t("shareholders.issueDate")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.shareholderName}</TableCell>
                <TableCell>{h.shareClass.name}</TableCell>
                <TableCell className="text-right">{nf.format(h.shares)}</TableCell>
                <TableCell className="text-right">{h.pricePerShare.toFixed(2)}</TableCell>
                <TableCell className="text-right">{nf.format(Math.round(h.shares * h.pricePerShare))}</TableCell>
                <TableCell>{h.issueDate.toISOString().slice(0, 10)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <HoldingDelete id={h.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {holdings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {shareClasses.length === 0 ? (
                    <span>
                      {t("shareholders.noClassesYet")}{" "}
                      <Link href="/equity/classes" className="underline">
                        {t("shareClasses.title")}
                      </Link>
                    </span>
                  ) : (
                    t("shareholders.noIssuances")
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
