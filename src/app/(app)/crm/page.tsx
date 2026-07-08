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
import { OpportunityForm } from "@/components/crm/opportunity-form"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { crmStages } from "@/lib/validations/crm"
import { prisma } from "@/lib/prisma"

const stageAccent: Record<string, string> = {
  NEW: "bg-slate-400",
  QUALIFIED: "bg-sky-500",
  PROPOSITION: "bg-amber-500",
  WON: "bg-emerald-500",
  LOST: "bg-rose-500",
}

const stageVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "outline",
  QUALIFIED: "secondary",
  PROPOSITION: "secondary",
  WON: "default",
  LOST: "destructive",
}

function toTitle(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stage?: string }>
}) {
  const { view, stage } = await searchParams
  const activeView = view === "list" ? "list" : "kanban"
  const activeStage =
    stage && (crmStages as readonly string[]).includes(stage) ? stage : undefined

  const [opportunities, customers] = await Promise.all([
    prisma.opportunity.findMany({
      where: activeStage ? { stage: activeStage } : undefined,
      include: { customer: true, owner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground">Track leads and opportunities.</p>
        </div>
        <OpportunityForm customers={customers} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={[...crmStages]} current={activeStage} />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {crmStages.map((s) => {
            const items = opportunities.filter((o) => o.stage === s)
            const total = items.reduce((sum, o) => sum + o.expectedRevenue, 0)
            return (
              <KanbanColumn
                key={s}
                title={`${toTitle(s)} · ${total.toFixed(0)}`}
                count={items.length}
                accent={stageAccent[s]}
              >
                {items.map((o) => (
                  <KanbanCard key={o.id} href={`/crm/${o.id}`}>
                    <div className="font-medium">{o.name}</div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {o.customer?.name ?? "No customer"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {o.expectedRevenue.toFixed(2)} &middot; {o.owner?.name ?? "Unassigned"}
                    </p>
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Expected Revenue</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/crm/${o.id}`} className="font-medium hover:underline">
                    {o.name}
                  </Link>
                </TableCell>
                <TableCell>{o.customer?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={stageVariant[o.stage] ?? "outline"}>{o.stage}</Badge>
                </TableCell>
                <TableCell className="text-right">{o.expectedRevenue.toFixed(2)}</TableCell>
                <TableCell>{o.owner?.name ?? "—"}</TableCell>
              </TableRow>
            ))}
            {opportunities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {activeStage ? "No opportunities in this stage." : "No opportunities yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
