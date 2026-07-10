"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { unlockPeriod } from "@/app/(app)/accounting/periods/actions"

export function PeriodUnlock({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await unlockPeriod(id)
            toast.success(t("periods.toasts.unlocked"))
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      {t("periods.unlock")}
    </Button>
  )
}
