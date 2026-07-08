"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/provider"
import { categorySchema, type CategoryInput } from "@/lib/validations/inventory"
import { createCategory, deleteCategory } from "@/app/(app)/inventory/products/actions"

type Category = { id: string; name: string }

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: CategoryInput) {
    try {
      await createCategory(values)
      toast.success(t("products.toasts.categoryCreated"))
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteCategory(id)
      toast.success(t("products.toasts.categoryDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        {t("products.manageCategories")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("products.categories")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder={t("products.newCategory")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{t("common.add")}</Button>
          </form>
        </Form>
        <div className="space-y-1">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("products.noCategories")}</p>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
            >
              {c.name}
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete(c.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
