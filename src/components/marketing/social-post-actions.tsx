"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/provider"
import { setSocialPostStatus, deleteSocialPost } from "@/app/(app)/marketing/social/actions"

export function SocialPostActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations()

  function run(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  return (
    <div className="flex justify-end gap-2">
      {status === "DRAFT" && (
        <Button size="sm" disabled={isPending} onClick={() => run(() => setSocialPostStatus(id, "SCHEDULED"), t("social.toasts.scheduled"))}>
          {t("social.schedule")}
        </Button>
      )}
      {status === "SCHEDULED" && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run(() => setSocialPostStatus(id, "PUBLISHED"), t("social.toasts.published"))}>
            {t("social.publish")}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => setSocialPostStatus(id, "DRAFT"), t("social.toasts.unscheduled"))}>
            {t("social.unschedule")}
          </Button>
        </>
      )}
      {(status === "DRAFT" || status === "SCHEDULED") && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => setSocialPostStatus(id, "CANCELLED"), t("social.toasts.cancelled"))}>
          {t("common.cancel")}
        </Button>
      )}
      {status === "CANCELLED" && (
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => run(() => deleteSocialPost(id), t("social.toasts.deleted"))}>
          {t("common.delete")}
        </Button>
      )}
    </div>
  )
}
