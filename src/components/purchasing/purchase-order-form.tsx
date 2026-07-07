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
import { purchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/purchasing"
import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from "@/app/(app)/purchasing/orders/actions"

type Option = { id: string; name: string }
type ProductOption = Option & { costPrice: number; taxRate: number }

type PurchaseOrderFormProps = {
  suppliers: Option[]
  warehouses: Option[]
  products: ProductOption[]
  mode?: "create" | "edit"
  orderId?: string
  defaultValues?: Partial<PurchaseOrderInput>
}

export function PurchaseOrderForm({
  suppliers,
  warehouses,
  products,
  mode = "create",
  orderId,
  defaultValues,
}: PurchaseOrderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<
    z.input<typeof purchaseOrderSchema>,
    unknown,
    PurchaseOrderInput
  >({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: "",
      warehouseId: "",
      notes: "",
      lines: [{ productId: "", quantity: 1, unitCost: 0, taxRate: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  async function onSubmit(values: PurchaseOrderInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && orderId) {
        const result = await updatePurchaseOrderAction(orderId, values)
        toast.success("Order updated")
        router.push(`/purchasing/orders/${result.id}`)
      } else {
        const result = await createPurchaseOrderAction(values)
        toast.success("Order created")
        router.push(`/purchasing/orders/${result.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
    }
  }

  function onProductChange(index: number, productId: string | null) {
    const product = products.find((p) => p.id === productId)
    if (product) {
      form.setValue(`lines.${index}.unitCost`, product.costPrice)
      form.setValue(`lines.${index}.taxRate`, product.taxRate)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "edit" ? "Edit Order" : "New Purchase Order"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((s) => (
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
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a warehouse" />
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
                  <FormLabel>Notes</FormLabel>
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
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-28">Quantity</TableHead>
                  <TableHead className="w-32">Unit Cost</TableHead>
                  <TableHead className="w-24">Tax %</TableHead>
                  <TableHead className="w-24 text-right">Line Total</TableHead>
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
                                    <SelectValue placeholder="Select a product" />
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
                          name={`lines.${index}.unitCost`}
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
                append({ productId: "", quantity: 1, unitCost: 0, taxRate: 0 })
              }
            >
              Add Line
            </Button>
            <div className="mt-4 flex justify-end">
              <OrderTotals control={form.control} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Order"}
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
  control: Control<z.input<typeof purchaseOrderSchema>, unknown, PurchaseOrderInput>
  index: number
}) {
  const quantity = useWatch({ control, name: `lines.${index}.quantity` })
  const unitCost = useWatch({ control, name: `lines.${index}.unitCost` })
  const taxRate = useWatch({ control, name: `lines.${index}.taxRate` })
  const amount = (Number(quantity) || 0) * (Number(unitCost) || 0)
  const { total } = computeTotals([{ amount, taxRate: Number(taxRate) || 0 }])
  return <>{total.toFixed(2)}</>
}

function OrderTotals({
  control,
}: {
  control: Control<z.input<typeof purchaseOrderSchema>, unknown, PurchaseOrderInput>
}) {
  const lines = useWatch({ control, name: "lines" })
  const { subtotal, tax, total } = computeTotals(
    (lines ?? []).map((l) => ({
      amount: (Number(l?.quantity) || 0) * (Number(l?.unitCost) || 0),
      taxRate: Number(l?.taxRate) || 0,
    }))
  )
  return (
    <div className="w-56 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax</span>
        <span>{tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between border-t pt-1 font-medium">
        <span>Total</span>
        <span>{total.toFixed(2)}</span>
      </div>
    </div>
  )
}
