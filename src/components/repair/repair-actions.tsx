"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setRepairStatus } from "@/app/(app)/repair/actions"

export function RepairActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setRepairStatus(id, next)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  return (
    <div className="flex justify-end gap-2">
      {status === "DRAFT" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run("CONFIRMED", t("repair.toasts.confirmed"))}>
            {t("common.confirm")}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run("CANCELLED", t("repair.toasts.cancelled"))}>
            {t("common.cancel")}
          </Button>
        </>
      )}
      {status === "CONFIRMED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("REPAIRED", t("repair.toasts.repaired"))}>
          {t("repair.markRepaired")}
        </Button>
      )}
      {status === "REPAIRED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("DONE", t("repair.toasts.delivered"))}>
          {t("repair.markDone")}
        </Button>
      )}
    </div>
  )
}
