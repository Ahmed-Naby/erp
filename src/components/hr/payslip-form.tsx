"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "@/components/i18n/provider"
import { payslipSchema, type PayslipInput } from "@/lib/validations/hr-suite"
import { createPayslip, updatePayslip } from "@/app/(app)/hr/payroll/actions"

type EmployeeOption = { id: string; name: string; wage: number }

export function PayslipForm({
  mode = "create",
  payslipId,
  defaultValues,
  employees,
  triggerVariant = "default",
}: {
  mode?: "create" | "edit"
  payslipId?: string
  defaultValues?: Partial<PayslipInput>
  employees: EmployeeOption[]
  triggerVariant?: "default" | "outline" | "ghost"
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations()

  const currentMonth = new Date().toISOString().slice(0, 7)

  const form = useForm<z.input<typeof payslipSchema>, unknown, PayslipInput>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeId: "",
      period: currentMonth,
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      ...defaultValues,
    },
  })

  function onEmployeeChange(id: string | null) {
    const employee = employees.find((e) => e.id === id)
    if (employee && mode === "create") {
      form.setValue("basicSalary", employee.wage)
    }
  }

  async function onSubmit(values: PayslipInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && payslipId) {
        await updatePayslip(payslipId, values)
        toast.success(t("payroll.toasts.updated"))
      } else {
        await createPayslip(values)
        toast.success(t("payroll.toasts.created"))
        form.reset()
      }
      setOpen(false)
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
        {mode === "edit" ? t("common.edit") : t("payroll.new")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("payroll.edit") : t("payroll.new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.employee")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      onEmployeeChange(v)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("common.selectEmployee")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payroll.period")}</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basicSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payroll.basicSalary")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allowances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payroll.allowances")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payroll.deductions")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
