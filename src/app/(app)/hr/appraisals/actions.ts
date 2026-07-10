"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { appraisalSchema } from "@/lib/validations/hr-suite"

function toData(data: ReturnType<typeof appraisalSchema.parse>) {
  const rating = data.rating && data.rating !== "none" ? Number(data.rating) : null
  return {
    employeeId: data.employeeId,
    date: data.date ? new Date(data.date) : new Date(),
    rating,
    feedback: data.feedback || null,
  }
}

export async function createAppraisal(input: unknown) {
  const data = appraisalSchema.parse(input)
  await prisma.appraisal.create({ data: toData(data) })
  revalidatePath("/hr/appraisals")
}

export async function updateAppraisal(id: string, input: unknown) {
  const data = appraisalSchema.parse(input)
  await prisma.appraisal.update({ where: { id }, data: toData(data) })
  revalidatePath("/hr/appraisals")
}

export async function setAppraisalStatus(id: string, status: string) {
  if (!["DRAFT", "DONE"].includes(status)) throw new Error("Invalid status")
  await prisma.appraisal.update({ where: { id }, data: { status } })
  revalidatePath("/hr/appraisals")
}
