"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { deleteEquipment } from "@/app/(app)/maintenance/equipment/actions"

export function EquipmentDelete({ id }: { id: string }) {
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
            await deleteEquipment(id)
            toast.success(t("equipment.toasts.deleted"))
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
