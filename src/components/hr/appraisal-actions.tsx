"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setAppraisalStatus } from "@/app/(app)/hr/appraisals/actions"

export function AppraisalActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setAppraisalStatus(id, next)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  if (status === "DONE") {
    return (
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => run("DRAFT", t("appraisals.toasts.reopened"))}>
        {t("appraisals.reopen")}
      </Button>
    )
  }

  return (
    <Button size="sm" disabled={isPending} onClick={() => run("DONE", t("appraisals.toasts.done"))}>
      {t("appraisals.markDone")}
    </Button>
  )
}
