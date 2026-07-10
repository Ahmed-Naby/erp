"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { timeOffSchema } from "@/lib/validations/hr-suite"

function toData(data: ReturnType<typeof timeOffSchema.parse>) {
  return {
    employeeId: data.employeeId,
    type: data.type,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    days: data.days,
    reason: data.reason || null,
  }
}

export async function createTimeOff(input: unknown) {
  const data = timeOffSchema.parse(input)
  await prisma.timeOff.create({ data: toData(data) })
  revalidatePath("/hr/time-off")
}

export async function updateTimeOff(id: string, input: unknown) {
  const data = timeOffSchema.parse(input)
  await prisma.timeOff.update({ where: { id }, data: toData(data) })
  revalidatePath("/hr/time-off")
}

export async function setTimeOffStatus(id: string, status: string) {
  if (!["DRAFT", "APPROVED", "REFUSED"].includes(status)) {
    throw new Error("Invalid status")
  }
  await prisma.timeOff.update({ where: { id }, data: { status } })
  revalidatePath("/hr/time-off")
}
