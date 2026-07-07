"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { toggleUserActive } from "@/app/(app)/settings/users/actions"

export function UserActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleUserActive(id, !active)
            toast.success(active ? "User deactivated" : "User activated")
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong")
          }
        })
      }
    >
      {active ? "Deactivate" : "Activate"}
    </Button>
  )
}
