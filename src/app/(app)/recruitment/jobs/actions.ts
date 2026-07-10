"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { jobPositionSchema } from "@/lib/validations/hr-suite"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

export async function createJobPosition(input: unknown) {
  const data = jobPositionSchema.parse(input)
  await prisma.jobPosition.create({
    data: {
      title: data.title,
      departmentId: relId(data.departmentId),
      description: data.description || null,
    },
  })
  revalidatePath("/recruitment/jobs")
}

export async function updateJobPosition(id: string, input: unknown) {
  const data = jobPositionSchema.parse(input)
  await prisma.jobPosition.update({
    where: { id },
    data: {
      title: data.title,
      departmentId: relId(data.departmentId),
      description: data.description || null,
    },
  })
  revalidatePath("/recruitment/jobs")
}

export async function toggleJobOpen(id: string, isOpen: boolean) {
  await prisma.jobPosition.update({ where: { id }, data: { isOpen } })
  revalidatePath("/recruitment/jobs")
}
