import { z } from "zod"

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.string().optional(),
})
export type PaymentInput = z.infer<typeof paymentSchema>
