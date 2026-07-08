"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import {
  cancelSalesOrderAction,
  confirmSalesOrderAction,
  generateInvoiceAction,
} from "@/app/(app)/sales/orders/actions"

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(action: () => Promise<unknown>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <>
          <Button
            disabled={isPending}
            onClick={() =>
              run(() => confirmSalesOrderAction(orderId), t("salesOrders.toasts.confirmed"))
            }
          >
            {t("salesOrders.confirm")}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => cancelSalesOrderAction(orderId), t("salesOrders.toasts.cancelled"))
            }
          >
            {t("common.cancel")}
          </Button>
        </>
      )}
      {status === "CONFIRMED" && (
        <Button
          disabled={isPending}
          onClick={() =>
            run(() => generateInvoiceAction(orderId), t("salesOrders.toasts.invoiced"))
          }
        >
          {t("salesOrders.generateInvoice")}
        </Button>
      )}
    </div>
  )
}
