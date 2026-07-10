import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MaintenanceRequestForm } from "@/components/maintenance/request-form"
import { MaintenanceRequestActions } from "@/components/maintenance/request-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { Pagination } from "@/components/shared/pagination"
import { maintenanceStages } from "@/lib/validations/supply-chain"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const KANBAN_TAKE = 200

const stageAccent: Record<string, string> = {
  NEW: "bg-slate-400",
  IN_PROGRESS: "bg-sky-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
}

const stageVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "outline",
  IN_PROGRESS: "secondary",
  DONE: "default",
  CANCELLED: "destructive",
}

export default async function MaintenanceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stage?: string; page?: string }>
}) {
  const { view, stage, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeView = view === "list" ? "list" : "kanban"
  const activeStage =
    stage && (maintenanceStages as readonly string[]).includes(stage) ? stage : undefined
  const page = parsePage(pageParam)
  const where = activeStage ? { stage: activeStage } : undefined

  const [total, requests, equipment] = await Promise.all([
    prisma.maintenanceRequest.count({ where }),
    prisma.maintenanceRequest.findMany({
      where,
      include: { equipment: true },
      orderBy: { createdAt: "desc" },
      ...(activeView === "kanban" ? { skip: 0, take: KANBAN_TAKE } : pageArgs(page)),
    }),
    prisma.equipment.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("maintenance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("maintenance.subtitle")}</p>
        </div>
        <MaintenanceRequestForm equipment={equipment} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={[...maintenanceStages]} current={activeStage} />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {maintenanceStages.map((s) => {
            const items = requests.filter((r) => r.stage === s)
            return (
              <KanbanColumn key={s} title={t(`status.${s}`)} count={items.length} accent={stageAccent[s]}>
                {items.map((r) => (
                  <KanbanCard key={r.id} href={`/maintenance/requests?view=kanban#${r.id}`}>
                    <div className="font-medium">{r.title}</div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {r.equipment?.name ?? t("maintenance.noEquipment")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{t(`maintType.${r.type}`)}</p>
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("maintenance.requestTitle")}</TableHead>
                <TableHead>{t("maintenance.equipment")}</TableHead>
                <TableHead>{t("maintenance.type")}</TableHead>
                <TableHead>{t("maintenance.stage")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.title}
                    <MaintenanceRequestForm
                      mode="edit"
                      requestId={r.id}
                      equipment={equipment}
                      triggerVariant="ghost"
                      defaultValues={{
                        title: r.title,
                        equipmentId: r.equipmentId ?? "none",
                        type: r.type as "CORRECTIVE" | "PREVENTIVE",
                        description: r.description ?? "",
                      }}
                    />
                  </TableCell>
                  <TableCell>{r.equipment?.name ?? "—"}</TableCell>
                  <TableCell>{t(`maintType.${r.type}`)}</TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[r.stage] ?? "outline"}>{t(`status.${r.stage}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <MaintenanceRequestActions id={r.id} stage={r.stage} />
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("maintenance.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={pageCount(total)} />
        </div>
      )}
    </div>
  )
}
