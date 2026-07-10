"use client"

import { useState } from "react"
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslations } from "@/components/i18n/provider"
import { manualJournalEntrySchema, type ManualJournalEntryInput } from "@/lib/validations/accounting"
import { createManualJournalEntry } from "@/app/(app)/accounting/journal/actions"

type AccountOption = { code: string; name: string }

export function ManualJournalForm({ accounts }: { accounts: AccountOption[] }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const form = useForm<z.input<typeof manualJournalEntrySchema>, unknown, ManualJournalEntryInput>({
    resolver: zodResolver(manualJournalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      memo: "",
      lines: [
        { accountCode: "", debit: 0, credit: 0 },
        { accountCode: "", debit: 0, credit: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" })

  async function onSubmit(values: ManualJournalEntryInput) {
    setIsSubmitting(true)
    try {
      await createManualJournalEntry(values)
      toast.success(t("manualJournal.toasts.posted"))
      form.reset()
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
      <DialogTrigger render={<Button />}>{t("manualJournal.new")}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("manualJournal.title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accounting.journal.memo")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("accounting.journal.account")}</TableHead>
                  <TableHead className="w-28 text-right">{t("accounting.journal.debit")}</TableHead>
                  <TableHead className="w-28 text-right">{t("accounting.journal.credit")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f, index) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.accountCode`}
                        render={({ field }) => (
                          <FormItem>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={t("manualJournal.selectAccount")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((a) => (
                                  <SelectItem key={a.code} value={a.code}>
                                    {a.code} · {a.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" className="text-right" {...field} value={field.value as number} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.credit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" className="text-right" {...field} value={field.value as number} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={fields.length <= 2}
                        onClick={() => remove(index)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ accountCode: "", debit: 0, credit: 0 })}
              >
                {t("manualJournal.addLine")}
              </Button>
              <Totals control={form.control} />
            </div>

            <FormField
              control={form.control}
              name="lines"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("manualJournal.post")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function Totals({ control }: { control: Control<z.input<typeof manualJournalEntrySchema>, unknown, ManualJournalEntryInput> }) {
  const t = useTranslations()
  const lines = useWatch({ control, name: "lines" })
  const debit = (lines ?? []).reduce((s, l) => s + (Number(l?.debit) || 0), 0)
  const credit = (lines ?? []).reduce((s, l) => s + (Number(l?.credit) || 0), 0)
  const balanced = debit > 0 && Math.abs(debit - credit) < 0.01
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{t("accounting.journal.debit")}:</span>{" "}
      <span className="font-medium">{debit.toFixed(2)}</span>
      {"  "}
      <span className="text-muted-foreground">{t("accounting.journal.credit")}:</span>{" "}
      <span className={`font-medium ${balanced ? "text-emerald-600" : "text-rose-600"}`}>{credit.toFixed(2)}</span>
    </div>
  )
}
