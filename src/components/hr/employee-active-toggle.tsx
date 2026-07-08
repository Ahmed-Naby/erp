"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { toggleEmployeeActive } from "@/app/(app)/hr/employees/actions"

export function EmployeeActiveToggle({ id, active }: { id: string; active: boolean }) {
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
            await toggleEmployeeActive(id, !active)
            toast.success(active ? t("hr.employees.toasts.archived") : t("hr.employees.toasts.restored"))
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      {active ? t("hr.employees.archive") : t("hr.employees.restore")}
    </Button>
  )
}
