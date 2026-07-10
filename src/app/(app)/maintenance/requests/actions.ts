"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { maintenanceRequestSchema, maintenanceStages } from "@/lib/validations/supply-chain"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toData(data: ReturnType<typeof maintenanceRequestSchema.parse>) {
  return {
    title: data.title,
    equipmentId: relId(data.equipmentId),
    type: data.type,
    description: data.description || null,
  }
}

export async function createMaintenanceRequest(input: unknown) {
  const data = maintenanceRequestSchema.parse(input)
  await prisma.maintenanceRequest.create({ data: toData(data) })
  revalidatePath("/maintenance/requests")
}

export async function updateMaintenanceRequest(id: string, input: unknown) {
  const data = maintenanceRequestSchema.parse(input)
  await prisma.maintenanceRequest.update({ where: { id }, data: toData(data) })
  revalidatePath("/maintenance/requests")
}

export async function setMaintenanceStage(id: string, stage: string) {
  if (!(maintenanceStages as readonly string[]).includes(stage)) {
    throw new Error("Invalid stage")
  }
  await prisma.maintenanceRequest.update({ where: { id }, data: { stage } })
  revalidatePath("/maintenance/requests")
}
