import { z } from "zod"

export const socialPlatforms = ["FACEBOOK", "TWITTER", "INSTAGRAM", "LINKEDIN"] as const
export const socialStatuses = ["DRAFT", "SCHEDULED", "PUBLISHED", "CANCELLED"] as const
export const socialPipeline = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const

export const socialPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Too long"),
  platform: z.enum(socialPlatforms),
  scheduledAt: z.string().optional(),
})
export type SocialPostInput = z.infer<typeof socialPostSchema>
