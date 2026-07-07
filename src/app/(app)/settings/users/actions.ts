"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/rbac"
import { logAudit } from "@/lib/audit"
import { userSchema } from "@/lib/validations/users"

export async function createUser(input: unknown) {
  const admin = await requireAdmin()
  const data = userSchema.parse(input)
  if (!data.password) {
    throw new Error("Password is required for new users")
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
    },
  })

  await logAudit({
    userId: admin.id,
    userEmail: admin.email ?? "unknown",
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    summary: `Created user ${user.email} (role: ${user.role})`,
  })

  revalidatePath("/settings/users")
}

export async function updateUser(id: string, input: unknown) {
  const admin = await requireAdmin()
  const data = userSchema.parse(input)
  const existing = await prisma.user.findUniqueOrThrow({ where: { id } })

  if (admin.id === id && data.role !== existing.role) {
    throw new Error("You cannot change your own role")
  }

  const changes: string[] = []
  if (data.name !== existing.name) changes.push(`name: "${existing.name}" -> "${data.name}"`)
  if (data.email !== existing.email) changes.push(`email: "${existing.email}" -> "${data.email}"`)
  if (data.role !== existing.role) changes.push(`role: ${existing.role} -> ${data.role}`)
  if (data.password) changes.push("password reset")

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
  })

  if (changes.length > 0) {
    await logAudit({
      userId: admin.id,
      userEmail: admin.email ?? "unknown",
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      summary: `Updated user ${existing.email}: ${changes.join(", ")}`,
    })
  }

  revalidatePath("/settings/users")
}

export async function toggleUserActive(id: string, active: boolean) {
  const admin = await requireAdmin()
  if (admin.id === id && !active) {
    throw new Error("You cannot deactivate your own account")
  }

  const user = await prisma.user.update({ where: { id }, data: { active } })

  await logAudit({
    userId: admin.id,
    userEmail: admin.email ?? "unknown",
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    summary: `${active ? "Activated" : "Deactivated"} user ${user.email}`,
  })

  revalidatePath("/settings/users")
}
