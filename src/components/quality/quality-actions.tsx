"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setQualityStatus } from "@/app/(app)/quality/actions"

export function QualityActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setQualityStatus(id, next)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  if (status === "PENDING") {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" disabled={isPending} onClick={() => run("PASS", t("quality.toasts.passed"))}>
          {t("quality.pass")}
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run("FAIL", t("quality.toasts.failed"))}>
          {t("quality.fail")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => run("PENDING", t("quality.toasts.reset"))}>
        {t("quality.reset")}
      </Button>
    </div>
  )
}
