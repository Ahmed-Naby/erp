"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { toggleJobOpen } from "@/app/(app)/recruitment/jobs/actions"

export function JobOpenToggle({ id, isOpen }: { id: string; isOpen: boolean }) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleJobOpen(id, !isOpen)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      {isOpen ? t("jobs.closed") : t("jobs.open")}
    </Button>
  )
}
