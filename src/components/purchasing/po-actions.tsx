"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import {
  cancelPurchaseOrderAction,
  receivePurchaseOrderAction,
  sendPurchaseOrderAction,
} from "@/app/(app)/purchasing/orders/actions"

export function PoActions({ orderId, status }: { orderId: string; status: string }) {
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
              run(() => sendPurchaseOrderAction(orderId), t("purchaseOrders.toasts.sent"))
            }
          >
            {t("purchaseOrders.send")}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => cancelPurchaseOrderAction(orderId), t("purchaseOrders.toasts.cancelled"))
            }
          >
            {t("common.cancel")}
          </Button>
        </>
      )}
      {status === "SENT" && (
        <>
          <Button
            disabled={isPending}
            onClick={() =>
              run(() => receivePurchaseOrderAction(orderId), t("purchaseOrders.toasts.received"))
            }
          >
            {t("purchaseOrders.receive")}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => cancelPurchaseOrderAction(orderId), t("purchaseOrders.toasts.cancelled"))
            }
          >
            {t("common.cancel")}
          </Button>
        </>
      )}
    </div>
  )
}
