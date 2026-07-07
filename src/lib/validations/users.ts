import { z } from "zod"

export const userRoles = ["ADMIN", "STAFF"] as const

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(userRoles),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
})
export type UserInput = z.infer<typeof userSchema>
