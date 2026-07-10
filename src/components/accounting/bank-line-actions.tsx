"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "@/components/i18n/provider"
import { matchBankLine, unmatchBankLine, deleteBankLine } from "@/app/(app)/accounting/bank/actions"

export type PaymentOption = { id: string; label: string; amount: number }

export function BankLineActions({
  lineId,
  reconciled,
  lineAmount,
  payments,
}: {
  lineId: string
  reconciled: boolean
  lineAmount: number
  payments: PaymentOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("")
  const router = useRouter()
  const t = useTranslations()

  function run(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(message)
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      }
    })
  }

  if (reconciled) {
    return (
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => unmatchBankLine(lineId), t("bank.toasts.unmatched"))}>
        {t("bank.unmatch")}
      </Button>
    )
  }

  // Suggest exact-amount matches first.
  const sorted = [...payments].sort((a, b) => {
    const aExact = Math.abs(Math.abs(a.amount) - Math.abs(lineAmount)) < 0.01 ? 0 : 1
    const bExact = Math.abs(Math.abs(b.amount) - Math.abs(lineAmount)) < 0.01 ? 0 : 1
    return aExact - bExact
  })

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" disabled={payments.length === 0} />}>
          {t("bank.match")}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("bank.matchTitle")}</DialogTitle>
          </DialogHeader>
          <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("bank.selectPayment")} />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              disabled={isPending || !selected}
              onClick={() => run(() => matchBankLine(lineId, selected), t("bank.toasts.matched"))}
            >
              {t("bank.match")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => run(() => deleteBankLine(lineId), t("bank.toasts.deleted"))}>
        {t("common.delete")}
      </Button>
    </div>
  )
}
