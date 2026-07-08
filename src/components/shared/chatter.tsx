import { MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

function initials(text: string) {
  const name = text.split("@")[0]
  const parts = name.split(/[.\-_ ]+/).filter(Boolean)
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return chars.toUpperCase()
}

const actionColor: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  UPDATE: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
}

type ChatterEntry = {
  id: string
  user: string
  summary: string
  when: Date
  tone: string
  system?: boolean
}

/**
 * Odoo-style "chatter" — the activity/message log shown alongside a record.
 * Sourced from the AuditLog for this entity, newest first, with a synthetic
 * "created" entry pinned to the bottom so the log is never empty.
 */
export async function Chatter({
  entityType,
  entityId,
  createdAt,
  createdLabel = "Record created",
}: {
  entityType: string
  entityId: string
  createdAt: Date
  createdLabel?: string
}) {
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  })

  const entries: ChatterEntry[] = logs.map((log) => ({
    id: log.id,
    user: log.userEmail,
    summary: log.summary,
    when: log.createdAt,
    tone: actionColor[log.action] ?? "bg-muted text-muted-foreground",
  }))

  entries.push({
    id: "created",
    user: "System",
    summary: createdLabel,
    when: createdAt,
    tone: "bg-muted text-muted-foreground",
    system: true,
  })

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Log</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <ol className="divide-y">
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                entry.tone
              )}
            >
              {entry.system ? "•" : initials(entry.user)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{entry.user}</span>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {entry.when.toLocaleString()}
                </time>
              </div>
              <p className="text-sm text-muted-foreground">{entry.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
