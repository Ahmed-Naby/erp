"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { toggleUserActive } from "@/app/(app)/settings/users/actions"

export function UserActiveToggle({ id, active }: { id: string; active: boolean }) {
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
            await toggleUserActive(id, !active)
            toast.success(active ? t("users.toasts.deactivated") : t("users.toasts.activated"))
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      {active ? t("users.deactivate") : t("users.activate")}
    </Button>
  )
}
