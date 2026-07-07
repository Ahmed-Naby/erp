import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})
export type CategoryInput = z.infer<typeof categorySchema>

export const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
})
export type WarehouseInput = z.infer<typeof warehouseSchema>

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  costPrice: z.coerce.number().min(0, "Must be 0 or more"),
  salePrice: z.coerce.number().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().min(0, "Must be 0 or more"),
  taxRate: z.coerce.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less"),
})
export type ProductInput = z.infer<typeof productSchema>

export const stockMovementTypes = ["IN", "OUT", "ADJUST", "TRANSFER"] as const

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().min(1, "Product is required"),
    warehouseId: z.string().min(1, "Warehouse is required"),
    type: z.enum(stockMovementTypes),
    quantity: z.coerce.number().min(0, "Must be 0 or more"),
    note: z.string().optional(),
  })
  .refine((data) => data.type === "ADJUST" || data.quantity > 0, {
    message: "Quantity must be greater than 0",
    path: ["quantity"],
  })
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
