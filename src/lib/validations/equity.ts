import { z } from "zod"

// Share class (e.g. Common, Preferred A)
export const shareClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parValue: z.coerce.number().min(0, "Must be 0 or more"),
})
export type ShareClassInput = z.infer<typeof shareClassSchema>

// Shareholder
export const shareholderTypes = ["INDIVIDUAL", "ENTITY"] as const
export const shareholderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  type: z.enum(shareholderTypes),
})
export type ShareholderInput = z.infer<typeof shareholderSchema>

// Share issuance (holding)
export const shareHoldingSchema = z.object({
  shareholderId: z.string().min(1, "Shareholder is required"),
  shareClassId: z.string().min(1, "Share class is required"),
  shares: z.coerce.number().positive("Must be greater than 0"),
  pricePerShare: z.coerce.number().min(0, "Must be 0 or more"),
  issueDate: z.string().optional(),
})
export type ShareHoldingInput = z.infer<typeof shareHoldingSchema>
