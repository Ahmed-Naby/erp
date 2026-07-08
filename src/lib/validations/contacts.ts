import { z } from "zod"

export const contactKinds = ["customer", "vendor"] as const
export type ContactKind = (typeof contactKinds)[number]

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  kind: z.enum(contactKinds),
})
export type ContactInput = z.infer<typeof contactSchema>
