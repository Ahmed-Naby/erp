"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "@/components/i18n/provider"
import { shareHoldingSchema, type ShareHoldingInput } from "@/lib/validations/equity"
import { issueShares } from "@/app/(app)/equity/shareholders/actions"

type Option = { id: string; name: string }

export function IssueSharesForm({
  shareholders,
  shareClasses,
  presetShareholderId,
  triggerVariant = "default",
  triggerLabel,
}: {
  shareholders: Option[]
  shareClasses: Option[]
  presetShareholderId?: string
  triggerVariant?: "default" | "outline" | "ghost"
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const form = useForm<z.input<typeof shareHoldingSchema>, unknown, ShareHoldingInput>({
    resolver: zodResolver(shareHoldingSchema),
    defaultValues: {
      shareholderId: presetShareholderId ?? "",
      shareClassId: "",
      shares: 0,
      pricePerShare: 0,
      issueDate: "",
    },
  })

  const noClasses = shareClasses.length === 0

  async function onSubmit(values: ShareHoldingInput) {
    setIsSubmitting(true)
    try {
      await issueShares(values)
      toast.success(t("shareholders.toasts.issued"))
      form.reset({
        shareholderId: presetShareholderId ?? "",
        shareClassId: "",
        shares: 0,
        pricePerShare: 0,
        issueDate: "",
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerVariant === "ghost" ? "sm" : "default"} />}>
        {triggerLabel ?? t("shareholders.issue")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shareholders.issueTitle")}</DialogTitle>
        </DialogHeader>
        {noClasses ? (
          <p className="text-sm text-muted-foreground">{t("shareholders.needClass")}</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!presetShareholderId && (
                <FormField
                  control={form.control}
                  name="shareholderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shareholders.shareholder")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("shareholders.selectShareholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shareholders.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="shareClassId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("shareholders.shareClass")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("shareholders.selectClass")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shareClasses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shareholders.shares")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerShare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shareholders.pricePerShare")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("shareholders.issueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("common.saving") : t("shareholders.issue")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
