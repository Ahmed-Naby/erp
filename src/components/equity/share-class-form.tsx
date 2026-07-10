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
import { useTranslations } from "@/components/i18n/provider"
import { shareClassSchema, type ShareClassInput } from "@/lib/validations/equity"
import { createShareClass, updateShareClass } from "@/app/(app)/equity/classes/actions"

export function ShareClassForm({
  mode = "create",
  classId,
  defaultValues,
  triggerVariant = "default",
}: {
  mode?: "create" | "edit"
  classId?: string
  defaultValues?: Partial<ShareClassInput>
  triggerVariant?: "default" | "outline" | "ghost"
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const form = useForm<z.input<typeof shareClassSchema>, unknown, ShareClassInput>({
    resolver: zodResolver(shareClassSchema),
    defaultValues: { name: "", parValue: 0, ...defaultValues },
  })

  async function onSubmit(values: ShareClassInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && classId) {
        await updateShareClass(classId, values)
        toast.success(t("shareClasses.toasts.updated"))
      } else {
        await createShareClass(values)
        toast.success(t("shareClasses.toasts.created"))
        form.reset()
      }
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
      <DialogTrigger
        render={<Button variant={triggerVariant} size={mode === "edit" ? "sm" : "default"} />}
      >
        {mode === "edit" ? t("common.edit") : t("shareClasses.new")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("shareClasses.edit") : t("shareClasses.new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("shareClasses.namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shareClasses.parValue")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
