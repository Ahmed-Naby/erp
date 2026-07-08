"use client"

import { useTransition } from "react"

import { locales } from "@/lib/i18n/config"
import { useLocale } from "@/components/i18n/provider"
import { setLocale } from "@/app/(app)/locale-actions"
import { cn } from "@/lib/utils"

const labels: Record<string, string> = { ar: "ع", en: "EN" }

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  function choose(next: string) {
    if (next === locale || isPending) return
    startTransition(async () => {
      await setLocale(next)
      window.location.reload()
    })
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md ring-1 ring-white/25">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === locale}
          disabled={isPending}
          className={cn(
            "px-2 py-1 text-xs font-medium transition-colors",
            l === locale ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
          )}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  )
}
