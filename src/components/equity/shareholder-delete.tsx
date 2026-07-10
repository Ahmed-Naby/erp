"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { deleteShareholder, deleteHolding } from "@/app/(app)/equity/shareholders/actions"

export function ShareholderDelete({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteShareholder(id)
            toast.success(t("shareholders.toasts.deleted"))
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      {t("common.delete")}
    </Button>
  )
}

export function HoldingDelete({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteHolding(id)
            toast.success(t("shareholders.toasts.holdingDeleted"))
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
          }
        })
      }
    >
      ✕
    </Button>
  )
}
