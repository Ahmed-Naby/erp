import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})
export type CustomerInput = z.infer<typeof customerSchema>

export const salesOrderLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Must be 0 or more"),
  taxRate: z.coerce.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less"),
})
export type SalesOrderLineInput = z.infer<typeof salesOrderLineSchema>

export const salesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
  lines: z.array(salesOrderLineSchema).min(1, "Add at least one line item"),
})
export type SalesOrderInput = z.infer<typeof salesOrderSchema>
