"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"

export function ViewSwitcher({ current }: { current: "list" | "kanban" }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function hrefFor(view: "list" | "kanban") {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", view)
    return `${pathname}?${params.toString()}`
  }

  const base =
    "flex size-8 items-center justify-center transition-colors first:rounded-l-md last:rounded-r-md"

  return (
    <div className="inline-flex ring-1 ring-border rounded-md" role="group" aria-label="View">
      <Link
        href={hrefFor("list")}
        aria-label="List view"
        aria-pressed={current === "list"}
        className={cn(
          base,
          current === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <List className="size-4" />
      </Link>
      <Link
        href={hrefFor("kanban")}
        aria-label="Kanban view"
        aria-pressed={current === "kanban"}
        className={cn(
          base,
          "border-l border-border",
          current === "kanban"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <LayoutGrid className="size-4" />
      </Link>
    </div>
  )
}
