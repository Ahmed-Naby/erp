import { z } from "zod"

// Manufacturing — Bill of Materials
export const bomLineSchema = z.object({
  productId: z.string().min(1, "Component is required"),
  quantity: z.coerce.number().positive("Must be greater than 0"),
})
export const bomSchema = z.object({
  productId: z.string().min(1, "Finished product is required"),
  quantity: z.coerce.number().positive("Must be greater than 0"),
  lines: z.array(bomLineSchema).min(1, "At least one component is required"),
})
export type BomInput = z.infer<typeof bomSchema>

// Manufacturing — Manufacturing Order
export const manufacturingOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Must be greater than 0"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  bomId: z.string().optional(),
})
export type ManufacturingOrderInput = z.infer<typeof manufacturingOrderSchema>

// Maintenance — Equipment
export const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  assignedToId: z.string().optional(),
})
export type EquipmentInput = z.infer<typeof equipmentSchema>

// Maintenance — Request
export const maintenanceTypes = ["CORRECTIVE", "PREVENTIVE"] as const
export const maintenanceStages = ["NEW", "IN_PROGRESS", "DONE", "CANCELLED"] as const
export const maintenancePipeline = ["NEW", "IN_PROGRESS", "DONE"] as const
export const maintenanceRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  equipmentId: z.string().optional(),
  type: z.enum(maintenanceTypes),
  description: z.string().optional(),
})
export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>

// Quality — Check
export const qualityCheckSchema = z.object({
  title: z.string().min(1, "Title is required"),
  productId: z.string().optional(),
  note: z.string().optional(),
})
export type QualityCheckInput = z.infer<typeof qualityCheckSchema>

// Repair — Order
export const repairOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  customerId: z.string().optional(),
  description: z.string().optional(),
})
export type RepairOrderInput = z.infer<typeof repairOrderSchema>
