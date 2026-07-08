"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { crmPipeline } from "@/lib/validations/crm"
import { setOpportunityStage } from "@/app/(app)/crm/actions"

function toTitle(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function OpportunityActions({ id, stage }: { id: string; stage: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function move(target: string, message: string) {
    startTransition(async () => {
      try {
        await setOpportunityStage(id, target)
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  const isClosed = stage === "WON" || stage === "LOST"

  if (isClosed) {
    return (
      <Button variant="outline" disabled={isPending} onClick={() => move("NEW", "Opportunity reopened")}>
        Reopen
      </Button>
    )
  }

  const index = (crmPipeline as readonly string[]).indexOf(stage)
  const next = crmPipeline[index + 1] ?? "WON"

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={() => move(next, `Moved to ${toTitle(next)}`)}>
        Move to {toTitle(next)}
      </Button>
      <Button variant="outline" disabled={isPending} onClick={() => move("LOST", "Marked as lost")}>
        Mark Lost
      </Button>
    </div>
  )
}
