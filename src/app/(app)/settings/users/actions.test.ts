import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const authMock = vi.fn()
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }))

const { prisma } = await import("@/lib/prisma")
const { resetDb } = await import("@/test/helpers")
const { createUser, updateUser, toggleUserActive } = await import(
  "@/app/(app)/settings/users/actions"
)

async function seedAdmin() {
  return prisma.user.create({
    data: {
      name: "Admin",
      email: `admin-${Date.now()}-${Math.random()}@test.local`,
      passwordHash: "x",
      role: "ADMIN",
    },
  })
}

function asAdmin(admin: { id: string; email: string; role: string }) {
  authMock.mockResolvedValue({ user: admin })
}

describe("settings/users actions", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("creates a user and records an audit log entry", async () => {
    const admin = await seedAdmin()
    asAdmin(admin)

    await createUser({
      name: "New Staffer",
      email: `staff-${Date.now()}@test.local`,
      role: "STAFF",
      password: "password123",
    })

    const created = await prisma.user.findFirstOrThrow({ where: { name: "New Staffer" } })
    expect(created.role).toBe("STAFF")
    expect(created.active).toBe(true)

    const entry = await prisma.auditLog.findFirstOrThrow({
      where: { entityType: "User", entityId: created.id, action: "CREATE" },
    })
    expect(entry.userEmail).toBe(admin.email)
    expect(entry.summary).toContain(created.email)
  })

  it("prevents an admin from changing their own role", async () => {
    const admin = await seedAdmin()
    asAdmin(admin)

    await expect(
      updateUser(admin.id, {
        name: admin.name,
        email: admin.email,
        role: "STAFF",
      })
    ).rejects.toThrow(/cannot change your own role/)
  })

  it("allows an admin to change another user's role and logs it", async () => {
    const admin = await seedAdmin()
    const staff = await prisma.user.create({
      data: {
        name: "Staffer",
        email: `staff-${Date.now()}-${Math.random()}@test.local`,
        passwordHash: "x",
        role: "STAFF",
      },
    })
    asAdmin(admin)

    await updateUser(staff.id, { name: staff.name, email: staff.email, role: "ADMIN" })

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: staff.id } })
    expect(updated.role).toBe("ADMIN")

    const entry = await prisma.auditLog.findFirstOrThrow({
      where: { entityType: "User", entityId: staff.id, action: "UPDATE" },
    })
    expect(entry.summary).toContain("role: STAFF -> ADMIN")
  })

  it("prevents an admin from deactivating their own account", async () => {
    const admin = await seedAdmin()
    asAdmin(admin)

    await expect(toggleUserActive(admin.id, false)).rejects.toThrow(
      /cannot deactivate your own account/
    )
  })

  it("allows an admin to deactivate another user and logs it", async () => {
    const admin = await seedAdmin()
    const staff = await prisma.user.create({
      data: {
        name: "Staffer2",
        email: `staff-${Date.now()}-${Math.random()}@test.local`,
        passwordHash: "x",
        role: "STAFF",
      },
    })
    asAdmin(admin)

    await toggleUserActive(staff.id, false)

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: staff.id } })
    expect(updated.active).toBe(false)

    const entry = await prisma.auditLog.findFirstOrThrow({
      where: { entityType: "User", entityId: staff.id, action: "UPDATE" },
    })
    expect(entry.summary).toContain("Deactivated")
  })
})
