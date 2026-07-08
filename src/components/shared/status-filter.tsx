"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

function toTitle(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function StatusFilter({
  statuses,
  current,
  paramName = "status",
}: {
  statuses: string[]
  current?: string
  paramName?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function hrefFor(status?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set(paramName, status)
    else params.delete(paramName)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const chip = "rounded-full px-3 py-1 text-xs font-medium transition-colors"

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={hrefFor(undefined)}
        className={cn(
          chip,
          !current
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        )}
      >
        All
      </Link>
      {statuses.map((status) => (
        <Link
          key={status}
          href={hrefFor(status)}
          className={cn(
            chip,
            current === status
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {toTitle(status)}
        </Link>
      ))}
    </div>
  )
}
