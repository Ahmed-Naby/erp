"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setPayslipStatus } from "@/app/(app)/hr/payroll/actions"

export function PayslipActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(next: string, message: string) {
    startTransition(async () => {
      try {
        await setPayslipStatus(id, next)
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
        <Button size="sm" disabled={isPending} onClick={() => run("CONFIRMED", t("payroll.toasts.confirmed"))}>
          {t("payroll.confirm")}
        </Button>
      )}
      {status === "CONFIRMED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("PAID", t("payroll.toasts.paid"))}>
          {t("payroll.pay")}
        </Button>
      )}
    </div>
  )
}
