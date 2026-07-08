"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { departmentSchema } from "@/lib/validations/hr"

export async function createDepartment(input: unknown) {
  const data = departmentSchema.parse(input)
  await prisma.department.create({ data: { name: data.name } })
  revalidatePath("/hr/departments")
  revalidatePath("/hr/employees")
}

export async function deleteDepartment(id: string) {
  await prisma.department.delete({ where: { id } })
  revalidatePath("/hr/departments")
  revalidatePath("/hr/employees")
}
