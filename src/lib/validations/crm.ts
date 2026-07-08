import { z } from "zod"

export const crmStages = ["NEW", "QUALIFIED", "PROPOSITION", "WON", "LOST"] as const
export type CrmStage = (typeof crmStages)[number]

/** The forward pipeline (LOST is an off-pipeline terminal state). */
export const crmPipeline = ["NEW", "QUALIFIED", "PROPOSITION", "WON"] as const

export const opportunitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  customerId: z.string().optional(),
  expectedRevenue: z.coerce.number().min(0, "Must be 0 or more"),
  notes: z.string().optional(),
})
export type OpportunityInput = z.infer<typeof opportunitySchema>
