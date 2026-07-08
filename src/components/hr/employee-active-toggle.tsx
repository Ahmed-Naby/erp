"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { toggleEmployeeActive } from "@/app/(app)/hr/employees/actions"

export function EmployeeActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleEmployeeActive(id, !active)
            toast.success(active ? "Employee archived" : "Employee restored")
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong")
          }
        })
      }
    >
      {active ? "Archive" : "Restore"}
    </Button>
  )
}
