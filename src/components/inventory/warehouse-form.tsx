"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { warehouseSchema, type WarehouseInput } from "@/lib/validations/inventory"
import {
  createWarehouse,
  updateWarehouse,
} from "@/app/(app)/inventory/warehouses/actions"

type WarehouseFormProps = {
  mode?: "create" | "edit"
  warehouseId?: string
  defaultValues?: Partial<WarehouseInput>
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "ghost"
}

export function WarehouseForm({
  mode = "create",
  warehouseId,
  defaultValues,
  triggerLabel,
  triggerVariant = "default",
}: WarehouseFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: "", location: "", ...defaultValues },
  })

  async function onSubmit(values: WarehouseInput) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && warehouseId) {
        await updateWarehouse(warehouseId, values)
        toast.success("Warehouse updated")
      } else {
        await createWarehouse(values)
        toast.success("Warehouse created")
        form.reset()
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={triggerVariant} size={mode === "edit" ? "sm" : "default"} />
        }
      >
        {triggerLabel ?? (mode === "edit" ? "Edit" : "New Warehouse")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
