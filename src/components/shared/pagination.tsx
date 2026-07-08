"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/provider"

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations()

  if (totalPages <= 1) return null

  function hrefFor(target: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(target))
    return `${pathname}?${params.toString()}`
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages
  const btn =
    "flex size-8 items-center justify-center rounded-md ring-1 ring-border transition-colors hover:bg-muted"

  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">
        {t("pagination.pageOf", { page, total: totalPages })}
      </span>
      <Link
        href={prevDisabled ? "#" : hrefFor(page - 1)}
        aria-disabled={prevDisabled}
        aria-label={t("pagination.previous")}
        className={cn(btn, prevDisabled && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Link>
      <Link
        href={nextDisabled ? "#" : hrefFor(page + 1)}
        aria-disabled={nextDisabled}
        aria-label={t("pagination.next")}
        className={cn(btn, nextDisabled && "pointer-events-none opacity-40")}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Link>
    </div>
  )
}
