import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ApplicantForm } from "@/components/recruitment/applicant-form"
import { ApplicantActions } from "@/components/recruitment/applicant-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { Pagination } from "@/components/shared/pagination"
import { applicantStages } from "@/lib/validations/hr-suite"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const KANBAN_TAKE = 200

const stageAccent: Record<string, string> = {
  NEW: "bg-slate-400",
  INTERVIEW: "bg-sky-500",
  OFFER: "bg-amber-500",
  HIRED: "bg-emerald-500",
  REFUSED: "bg-rose-500",
}

const stageVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "outline",
  INTERVIEW: "secondary",
  OFFER: "secondary",
  HIRED: "default",
  REFUSED: "destructive",
}

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stage?: string; page?: string }>
}) {
  const { view, stage, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeView = view === "list" ? "list" : "kanban"
  const activeStage =
    stage && (applicantStages as readonly string[]).includes(stage) ? stage : undefined
  const page = parsePage(pageParam)
  const where = activeStage ? { stage: activeStage } : undefined

  const [total, applicants, positions] = await Promise.all([
    prisma.applicant.count({ where }),
    prisma.applicant.findMany({
      where,
      include: { jobPosition: true },
      orderBy: { createdAt: "desc" },
      ...(activeView === "kanban" ? { skip: 0, take: KANBAN_TAKE } : pageArgs(page)),
    }),
    prisma.jobPosition.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ])

  const positionOptions = positions.map((p) => ({ id: p.id, name: p.title }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("applicants.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("applicants.subtitle")}</p>
        </div>
        <ApplicantForm positions={positionOptions} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={[...applicantStages]} current={activeStage} />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {applicantStages.map((s) => {
            const items = applicants.filter((a) => a.stage === s)
            return (
              <KanbanColumn key={s} title={t(`status.${s}`)} count={items.length} accent={stageAccent[s]}>
                {items.map((a) => (
                  <KanbanCard key={a.id} href={`/recruitment/applicants?view=kanban#${a.id}`}>
                    <div className="font-medium">{a.name}</div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {a.jobPosition?.title ?? t("applicants.noPosition")}
                    </p>
                    {a.email && (
                      <p className="mt-2 truncate text-xs text-muted-foreground">{a.email}</p>
                    )}
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
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("applicants.position")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("applicants.stage")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.name}
                    <ApplicantForm
                      mode="edit"
                      applicantId={a.id}
                      positions={positionOptions}
                      triggerVariant="ghost"
                      defaultValues={{
                        name: a.name,
                        email: a.email ?? "",
                        phone: a.phone ?? "",
                        jobPositionId: a.jobPositionId ?? "none",
                      }}
                    />
                  </TableCell>
                  <TableCell>{a.jobPosition?.title ?? "—"}</TableCell>
                  <TableCell>{a.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[a.stage] ?? "outline"}>{t(`status.${a.stage}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ApplicantActions id={a.id} stage={a.stage} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {applicants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("applicants.empty")}
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
