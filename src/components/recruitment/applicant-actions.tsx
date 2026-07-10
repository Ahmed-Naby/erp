"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { applicantPipeline } from "@/lib/validations/hr-suite"
import { setApplicantStage } from "@/app/(app)/recruitment/applicants/actions"

export function ApplicantActions({ id, stage }: { id: string; stage: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function move(target: string, message: string) {
    startTransition(async () => {
      try {
        await setApplicantStage(id, target)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  const isClosed = stage === "HIRED" || stage === "REFUSED"

  if (isClosed) {
    return (
      <Button variant="outline" disabled={isPending} onClick={() => move("NEW", t("applicants.toasts.reopened"))}>
        {t("applicants.reopen")}
      </Button>
    )
  }

  const index = (applicantPipeline as readonly string[]).indexOf(stage)
  const next = applicantPipeline[index + 1] ?? "HIRED"
  const nextLabel = t(`status.${next}`)

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={() => move(next, t("applicants.toasts.moved", { stage: nextLabel }))}>
        {t("applicants.moveTo", { stage: nextLabel })}
      </Button>
      <Button variant="outline" disabled={isPending} onClick={() => move("REFUSED", t("applicants.toasts.refused"))}>
        {t("applicants.markRefused")}
      </Button>
    </div>
  )
}
