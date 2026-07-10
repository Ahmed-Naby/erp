"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { maintenancePipeline } from "@/lib/validations/supply-chain"
import { setMaintenanceStage } from "@/app/(app)/maintenance/requests/actions"

export function MaintenanceRequestActions({ id, stage }: { id: string; stage: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function move(target: string, message: string) {
    startTransition(async () => {
      try {
        await setMaintenanceStage(id, target)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  if (stage === "DONE" || stage === "CANCELLED") {
    return (
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => move("NEW", t("maintenance.toasts.reopened"))}>
        {t("maintenance.reopen")}
      </Button>
    )
  }

  const index = (maintenancePipeline as readonly string[]).indexOf(stage)
  const next = maintenancePipeline[index + 1] ?? "DONE"
  const nextLabel = t(`status.${next}`)

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={isPending} onClick={() => move(next, t("maintenance.toasts.moved", { stage: nextLabel }))}>
        {t("maintenance.moveTo", { stage: nextLabel })}
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => move("CANCELLED", t("maintenance.toasts.cancelled"))}>
        {t("common.cancel")}
      </Button>
    </div>
  )
}
