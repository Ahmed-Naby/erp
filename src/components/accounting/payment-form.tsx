"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { paymentSchema, type PaymentInput } from "@/lib/validations/payments"
import {
  recordInvoicePaymentAction,
  recordPurchaseOrderPaymentAction,
} from "@/app/(app)/accounting/payments/actions"

type PaymentFormProps = {
  targetType: "invoice" | "purchaseOrder"
  targetId: string
  amountDue: number
}

export function PaymentForm({ targetType, targetId, amountDue }: PaymentFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.input<typeof paymentSchema>, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: amountDue,
      method: "",
    },
  })

  async function onSubmit(values: PaymentInput) {
    setIsSubmitting(true)
    try {
      if (targetType === "invoice") {
        await recordInvoicePaymentAction(targetId, values)
      } else {
        await recordPurchaseOrderPaymentAction(targetId, values)
      }
      toast.success(t("payments.toasts.recorded"))
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (amountDue <= 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>{t("payments.record")}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("payments.record")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("payments.amountDue", { amount: amountDue.toFixed(2) })}
            </p>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payments.amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payments.method")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("payments.methodPlaceholder")} {...field} />
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
