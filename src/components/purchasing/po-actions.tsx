"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  cancelPurchaseOrderAction,
  receivePurchaseOrderAction,
  sendPurchaseOrderAction,
} from "@/app/(app)/purchasing/orders/actions"

export function PoActions({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
            onClick={() => run(() => sendPurchaseOrderAction(orderId), "Order sent")}
          >
            Send Order
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => cancelPurchaseOrderAction(orderId), "Order cancelled")}
          >
            Cancel
          </Button>
        </>
      )}
      {status === "SENT" && (
        <>
          <Button
            disabled={isPending}
            onClick={() => run(() => receivePurchaseOrderAction(orderId), "Order received, stock updated")}
          >
            Receive Order
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => cancelPurchaseOrderAction(orderId), "Order cancelled")}
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  )
}
