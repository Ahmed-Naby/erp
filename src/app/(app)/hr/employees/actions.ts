"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { employeeSchema } from "@/lib/validations/hr"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

function toData(data: ReturnType<typeof employeeSchema.parse>) {
  return {
    name: data.name,
    jobTitle: data.jobTitle || null,
    workEmail: data.workEmail || null,
    workPhone: data.workPhone || null,
    departmentId: relId(data.departmentId),
    managerId: relId(data.managerId),
    hireDate: data.hireDate ? new Date(data.hireDate) : null,
    wage: data.wage,
  }
}

export async function createEmployee(input: unknown) {
  const data = employeeSchema.parse(input)
  await prisma.employee.create({ data: toData(data) })
  revalidatePath("/hr/employees")
}

export async function updateEmployee(id: string, input: unknown) {
  const data = employeeSchema.parse(input)
  if (relId(data.managerId) === id) {
    throw new Error("An employee cannot be their own manager")
  }
  await prisma.employee.update({ where: { id }, data: toData(data) })
  revalidatePath("/hr/employees")
  revalidatePath(`/hr/employees/${id}`)
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  await prisma.employee.update({ where: { id }, data: { active } })
  revalidatePath("/hr/employees")
  revalidatePath(`/hr/employees/${id}`)
}
