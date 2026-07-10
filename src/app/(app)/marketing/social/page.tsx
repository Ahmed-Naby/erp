import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SocialPostForm } from "@/components/marketing/social-post-form"
import { SocialPostActions } from "@/components/marketing/social-post-actions"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { Pagination } from "@/components/shared/pagination"
import { socialStatuses } from "@/lib/validations/marketing"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

const KANBAN_TAKE = 200

const statusAccent: Record<string, string> = {
  DRAFT: "bg-slate-400",
  SCHEDULED: "bg-amber-500",
  PUBLISHED: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  PUBLISHED: "default",
  CANCELLED: "destructive",
}

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "—"
}

export default async function SocialMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; page?: string }>
}) {
  const { view, status, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeView = view === "list" ? "list" : "kanban"
  const activeStatus =
    status && (socialStatuses as readonly string[]).includes(status) ? status : undefined
  const page = parsePage(pageParam)
  const where = activeStatus ? { status: activeStatus } : undefined

  const [total, posts] = await Promise.all([
    prisma.socialPost.count({ where }),
    prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(activeView === "kanban" ? { skip: 0, take: KANBAN_TAKE } : pageArgs(page)),
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("social.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("social.subtitle")}</p>
        </div>
        <SocialPostForm />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={[...socialStatuses]} current={activeStatus} />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {socialStatuses.map((s) => {
            const items = posts.filter((p) => p.status === s)
            return (
              <KanbanColumn key={s} title={t(`socialStatus.${s}`)} count={items.length} accent={statusAccent[s]}>
                {items.map((p) => (
                  <KanbanCard key={p.id} href={`/marketing/social?view=kanban#${p.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{t(`socialPlatform.${p.platform}`)}</Badge>
                      {p.scheduledAt && (
                        <span className="text-xs text-muted-foreground">{fmt(p.scheduledAt)}</span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm">{p.content}</p>
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
                <TableHead>{t("social.platform")}</TableHead>
                <TableHead>{t("social.content")}</TableHead>
                <TableHead>{t("social.scheduledAt")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Badge variant="outline">{t(`socialPlatform.${p.platform}`)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="line-clamp-2">{p.content}</span>
                    {(p.status === "DRAFT" || p.status === "SCHEDULED") && (
                      <SocialPostForm
                        mode="edit"
                        postId={p.id}
                        triggerVariant="ghost"
                        defaultValues={{
                          content: p.content,
                          platform: p.platform as "FACEBOOK" | "TWITTER" | "INSTAGRAM" | "LINKEDIN",
                          scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString().slice(0, 16) : "",
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmt(p.scheduledAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] ?? "outline"}>{t(`socialStatus.${p.status}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <SocialPostActions id={p.id} status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("social.empty")}
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
