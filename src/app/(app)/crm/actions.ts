"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { crmStages, opportunitySchema } from "@/lib/validations/crm"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toTitle(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export async function createOpportunity(input: unknown) {
  const data = opportunitySchema.parse(input)
  const session = await auth()
  const opportunity = await prisma.opportunity.create({
    data: {
      name: data.name,
      customerId: relId(data.customerId),
      expectedRevenue: data.expectedRevenue,
      notes: data.notes || null,
      ownerId: session?.user?.id,
    },
  })
  revalidatePath("/crm")
  return { id: opportunity.id }
}

export async function updateOpportunity(id: string, input: unknown) {
  const data = opportunitySchema.parse(input)
  await prisma.opportunity.update({
    where: { id },
    data: {
      name: data.name,
      customerId: relId(data.customerId),
      expectedRevenue: data.expectedRevenue,
      notes: data.notes || null,
    },
  })
  revalidatePath("/crm")
  revalidatePath(`/crm/${id}`)
}

export async function setOpportunityStage(id: string, stage: string) {
  if (!(crmStages as readonly string[]).includes(stage)) {
    throw new Error("Invalid stage")
  }
  const session = await auth()
  await prisma.opportunity.update({ where: { id }, data: { stage } })
  await logAudit({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? "unknown",
    action: "UPDATE",
    entityType: "Opportunity",
    entityId: id,
    summary: `Moved to ${toTitle(stage)}`,
  })
  revalidatePath("/crm")
  revalidatePath(`/crm/${id}`)
}
