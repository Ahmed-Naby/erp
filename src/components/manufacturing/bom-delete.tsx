"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { deleteBom } from "@/app/(app)/manufacturing/boms/actions"

export function BomDelete({ id }: { id: string }) {
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
            await deleteBom(id)
            toast.success(t("boms.toasts.deleted"))
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
