import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})
export type SupplierInput = z.infer<typeof supplierSchema>

export const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Must be 0 or more"),
  taxRate: z.coerce.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less"),
})
export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, "Add at least one line item"),
})
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
