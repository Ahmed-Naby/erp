"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setExpenseStatus } from "@/app/(app)/expenses/actions"

export function ExpenseActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setExpenseStatus(id, next)
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
        <Button size="sm" disabled={isPending} onClick={() => run("SUBMITTED", t("expenses.toasts.submitted"))}>
          {t("expenses.submit")}
        </Button>
      )}
      {status === "SUBMITTED" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run("APPROVED", t("expenses.toasts.approved"))}>
            {t("common.approve")}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run("REFUSED", t("expenses.toasts.refused"))}>
            {t("common.refuse")}
          </Button>
        </>
      )}
      {status === "APPROVED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("POSTED", t("expenses.toasts.posted"))}>
          {t("expenses.post")}
        </Button>
      )}
    </div>
  )
}
