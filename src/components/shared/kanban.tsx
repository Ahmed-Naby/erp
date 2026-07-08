import Link from "next/link"

import { cn } from "@/lib/utils"

export function KanbanBoard({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>
}

export function KanbanColumn({
  title,
  count,
  accent,
  children,
}: {
  title: string
  count: number
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full bg-muted-foreground/40", accent)} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">
        {count === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nothing here</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function KanbanCard({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {children}
    </Link>
  )
}
