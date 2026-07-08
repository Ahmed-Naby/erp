"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { computeTotals } from "@/lib/money"
import { useTranslations } from "@/components/i18n/provider"
import { salesOrderSchema, type SalesOrderInput } from "@/lib/validations/sales"
import {
  createSalesOrderAction,
  updateSalesOrderAction,
} from "@/app/(app)/sales/orders/actions"

type Option = { id: string; name: string }
type ProductOption = Option & { salePrice: number; taxRate: number }

type SalesOrderFormProps = {
  customers: Option[]
  warehouses: Option[]
  products: ProductOption[]
  mode?: "create" | "edit"
  orderId?: string
  defaultValues?: Partial<SalesOrderInput>
}

export function SalesOrderForm({
  customers,
  warehouses,
  products,
  mode = "create",
  orderId,
  defaultValues,
}: SalesOrderFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<
    z.input<typeof salesOrderSchema>,
    unknown,
    SalesOrderInput
  >({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customerId: "",
      warehouseId: "",
      notes: "",
      lines: [{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  async function onSubmit(values: SalesOrderInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && orderId) {
        const result = await updateSalesOrderAction(orderId, values)
        toast.success(t("salesOrders.toasts.updated"))
        router.push(`/sales/orders/${result.id}`)
      } else {
        const result = await createSalesOrderAction(values)
        toast.success(t("salesOrders.toasts.created"))
        router.push(`/sales/orders/${result.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"))
      setIsSubmitting(false)
    }
  }

  function onProductChange(index: number, productId: string | null) {
    const product = products.find((p) => p.id === productId)
    if (product) {
      form.setValue(`lines.${index}.unitPrice`, product.salePrice)
      form.setValue(`lines.${index}.taxRate`, product.taxRate)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "edit" ? t("salesOrders.form.edit") : t("salesOrders.form.new")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("salesOrders.customer")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("salesOrders.form.selectCustomer")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
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
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("salesOrders.form.warehouse")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("salesOrders.form.selectWarehouse")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("salesOrders.lineItems")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("stockMovements.product")}</TableHead>
                  <TableHead className="w-28">{t("common.quantity")}</TableHead>
                  <TableHead className="w-32">{t("salesOrders.unitPrice")}</TableHead>
                  <TableHead className="w-24">{t("products.taxRate")}</TableHead>
                  <TableHead className="w-24 text-right">{t("salesOrders.lineTotal")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.productId`}
                          render={({ field: f }) => (
                            <FormItem>
                              <Select
                                value={f.value}
                                onValueChange={(v) => {
                                  f.onChange(v)
                                  onProductChange(index, v)
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t("salesOrders.form.selectProduct")} />
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
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...f}
                                  value={f.value as number}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unitPrice`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...f}
                                  value={f.value as number}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.taxRate`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...f}
                                  value={f.value as number}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <LineTotal control={form.control} index={index} />
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
                  )
                })}
              </TableBody>
            </Table>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() =>
                append({ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 })
              }
            >
              {t("salesOrders.form.addLine")}
            </Button>
            <div className="mt-4 flex justify-end">
              <OrderTotals control={form.control} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("salesOrders.saveOrder")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

function LineTotal({
  control,
  index,
}: {
  control: Control<z.input<typeof salesOrderSchema>, unknown, SalesOrderInput>
  index: number
}) {
  const quantity = useWatch({ control, name: `lines.${index}.quantity` })
  const unitPrice = useWatch({ control, name: `lines.${index}.unitPrice` })
  const taxRate = useWatch({ control, name: `lines.${index}.taxRate` })
  const amount = (Number(quantity) || 0) * (Number(unitPrice) || 0)
  const { total } = computeTotals([{ amount, taxRate: Number(taxRate) || 0 }])
  return <>{total.toFixed(2)}</>
}

function OrderTotals({
  control,
}: {
  control: Control<z.input<typeof salesOrderSchema>, unknown, SalesOrderInput>
}) {
  const t = useTranslations()
  const lines = useWatch({ control, name: "lines" })
  const { subtotal, tax, total } = computeTotals(
    (lines ?? []).map((l) => ({
      amount: (Number(l?.quantity) || 0) * (Number(l?.unitPrice) || 0),
      taxRate: Number(l?.taxRate) || 0,
    }))
  )
  return (
    <div className="w-56 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("common.subtotal")}</span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("common.tax")}</span>
        <span>{tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between border-t pt-1 font-medium">
        <span>{t("common.total")}</span>
        <span>{total.toFixed(2)}</span>
      </div>
    </div>
  )
}
