"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { crmPipeline } from "@/lib/validations/crm"
import { setOpportunityStage } from "@/app/(app)/crm/actions"

export function OpportunityActions({ id, stage }: { id: string; stage: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function move(target: string, message: string) {
    startTransition(async () => {
      try {
        await setOpportunityStage(id, target)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  const isClosed = stage === "WON" || stage === "LOST"

  if (isClosed) {
    return (
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => move("NEW", t("crm.toasts.reopened"))}
      >
        {t("crm.reopen")}
      </Button>
    )
  }

  const index = (crmPipeline as readonly string[]).indexOf(stage)
  const next = crmPipeline[index + 1] ?? "WON"
  const nextLabel = t(`status.${next}`)

  return (
    <div className="flex gap-2">
      <Button
        disabled={isPending}
        onClick={() => move(next, t("crm.toasts.movedTo", { stage: nextLabel }))}
      >
        {t("crm.moveTo", { stage: nextLabel })}
      </Button>
      <Button variant="outline" disabled={isPending} onClick={() => move("LOST", t("crm.toasts.lost"))}>
        {t("crm.markLost")}
      </Button>
    </div>
  )
}
