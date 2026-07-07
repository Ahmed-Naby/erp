"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  cancelSalesOrderAction,
  confirmSalesOrderAction,
  generateInvoiceAction,
} from "@/app/(app)/sales/orders/actions"

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
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
            onClick={() => run(() => confirmSalesOrderAction(orderId), "Order confirmed, stock deducted")}
          >
            Confirm Order
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => cancelSalesOrderAction(orderId), "Order cancelled")}
          >
            Cancel
          </Button>
        </>
      )}
      {status === "CONFIRMED" && (
        <Button
          disabled={isPending}
          onClick={() => run(() => generateInvoiceAction(orderId), "Invoice generated")}
        >
          Generate Invoice
        </Button>
      )}
    </div>
  )
}
