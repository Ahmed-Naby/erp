"use client"

import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
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
import { bomSchema, type BomInput } from "@/lib/validations/supply-chain"
import { createBom, updateBom } from "@/app/(app)/manufacturing/boms/actions"

type ProductOption = { id: string; name: string }

export function BomForm({
  mode = "create",
  bomId,
  defaultValues,
  products,
  triggerVariant = "default",
}: {
  mode?: "create" | "edit"
  bomId?: string
  defaultValues?: Partial<BomInput>
  products: ProductOption[]
  triggerVariant?: "default" | "outline" | "ghost"
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const form = useForm<z.input<typeof bomSchema>, unknown, BomInput>({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      lines: [{ productId: "", quantity: 1 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" })

  async function onSubmit(values: BomInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && bomId) {
        await updateBom(bomId, values)
        toast.success(t("boms.toasts.updated"))
      } else {
        await createBom(values)
        toast.success(t("boms.toasts.created"))
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
        {mode === "edit" ? t("common.edit") : t("boms.new")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("boms.edit") : t("boms.new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("boms.finishedProduct")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("boms.selectProduct")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("boms.producedQuantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>{t("boms.components")}</FormLabel>
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("boms.component")}</TableHead>
                    <TableHead className="w-28">{t("common.quantity")}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((f, index) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t("boms.selectComponent")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
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
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} value={field.value as number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          ✕
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ productId: "", quantity: 1 })}
              >
                {t("boms.addComponent")}
              </Button>
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
