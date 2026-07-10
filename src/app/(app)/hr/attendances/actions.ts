"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { attendanceSchema } from "@/lib/validations/hr-suite"

function toData(data: ReturnType<typeof attendanceSchema.parse>) {
  return {
    employeeId: data.employeeId,
    checkIn: new Date(data.checkIn),
    checkOut: data.checkOut ? new Date(data.checkOut) : null,
  }
}

export async function createAttendance(input: unknown) {
  const data = attendanceSchema.parse(input)
  await prisma.attendance.create({ data: toData(data) })
  revalidatePath("/hr/attendances")
}

export async function updateAttendance(id: string, input: unknown) {
  const data = attendanceSchema.parse(input)
  await prisma.attendance.update({ where: { id }, data: toData(data) })
  revalidatePath("/hr/attendances")
}
