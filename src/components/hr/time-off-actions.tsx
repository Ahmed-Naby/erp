"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setTimeOffStatus } from "@/app/(app)/hr/time-off/actions"

export function TimeOffActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setTimeOffStatus(id, next)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  if (status !== "DRAFT") return null

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={isPending} onClick={() => run("APPROVED", t("timeOff.toasts.approved"))}>
        {t("common.approve")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run("REFUSED", t("timeOff.toasts.refused"))}
      >
        {t("common.refuse")}
      </Button>
    </div>
  )
}
