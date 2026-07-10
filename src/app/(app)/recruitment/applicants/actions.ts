"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { applicantSchema, applicantStages } from "@/lib/validations/hr-suite"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toData(data: ReturnType<typeof applicantSchema.parse>) {
  return {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    jobPositionId: relId(data.jobPositionId),
  }
}

export async function createApplicant(input: unknown) {
  const data = applicantSchema.parse(input)
  await prisma.applicant.create({ data: toData(data) })
  revalidatePath("/recruitment/applicants")
}

export async function updateApplicant(id: string, input: unknown) {
  const data = applicantSchema.parse(input)
  await prisma.applicant.update({ where: { id }, data: toData(data) })
  revalidatePath("/recruitment/applicants")
}

export async function setApplicantStage(id: string, stage: string) {
  if (!(applicantStages as readonly string[]).includes(stage)) {
    throw new Error("Invalid stage")
  }
  await prisma.applicant.update({ where: { id }, data: { stage } })
  revalidatePath("/recruitment/applicants")
}
