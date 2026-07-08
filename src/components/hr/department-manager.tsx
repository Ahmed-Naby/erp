"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/provider"
import { departmentSchema, type DepartmentInput } from "@/lib/validations/hr"
import { createDepartment, deleteDepartment } from "@/app/(app)/hr/departments/actions"

type Department = { id: string; name: string; count: number }

export function DepartmentManager({ departments }: { departments: Department[] }) {
  const t = useTranslations()
  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: DepartmentInput) {
    try {
      await createDepartment(values)
      toast.success(t("hr.departments.toasts.created"))
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteDepartment(id)
      toast.success(t("hr.departments.toasts.deleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder={t("hr.departments.new")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t("common.add")}</Button>
        </form>
      </Form>
      <div className="space-y-1">
        {departments.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("hr.departments.empty")}</p>
        )}
        {departments.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {d.name}
              <span className="ms-2 text-xs text-muted-foreground">
                {t("hr.departments.employeeCount", { n: d.count })}
              </span>
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(d.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
