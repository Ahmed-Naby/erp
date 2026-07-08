import Link from "next/link"
import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpportunityActions } from "@/components/crm/opportunity-actions"
import { OpportunityForm } from "@/components/crm/opportunity-form"
import { StatusBar } from "@/components/shared/status-bar"
import { Chatter } from "@/components/shared/chatter"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getTranslations()
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { customer: true, owner: true },
  })
  if (!opportunity) notFound()

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{opportunity.name}</h1>
          <p className="text-sm text-muted-foreground">
            {opportunity.customer?.name ?? t("crm.noCustomer")} &middot;{" "}
            {opportunity.expectedRevenue.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBar
            stages={["NEW", "QUALIFIED", "PROPOSITION", "WON"]}
            current={opportunity.stage}
            exceptionStatus="LOST"
          />
          <div className="flex gap-2">
            <OpportunityForm
              mode="edit"
              opportunityId={opportunity.id}
              triggerVariant="outline"
              customers={customers}
              defaultValues={{
                name: opportunity.name,
                customerId: opportunity.customerId ?? "none",
                expectedRevenue: opportunity.expectedRevenue,
                notes: opportunity.notes ?? "",
              }}
            />
            <OpportunityActions id={opportunity.id} stage={opportunity.stage} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("crm.customer")}</span>
                <span className="text-right">
                  {opportunity.customer ? (
                    <Link
                      href={`/contacts/customer/${opportunity.customer.id}`}
                      className="hover:underline"
                    >
                      {opportunity.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("crm.expectedRevenue")}</span>
                <span className="text-right">{opportunity.expectedRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("crm.owner")}</span>
                <span className="text-right">{opportunity.owner?.name ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          {opportunity.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("common.notes")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {opportunity.notes}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Chatter
            entityType="Opportunity"
            entityId={opportunity.id}
            createdAt={opportunity.createdAt}
            createdLabel={t("crm.createdLabel", { name: opportunity.name })}
          />
        </div>
      </div>
    </div>
  )
}
