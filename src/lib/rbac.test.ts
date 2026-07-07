import { describe, expect, it, vi } from "vitest"

const authMock = vi.fn()
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }))

const { requireAdmin } = await import("@/lib/rbac")

describe("requireAdmin", () => {
  it("throws when there is no session", async () => {
    authMock.mockResolvedValueOnce(null)
    await expect(requireAdmin()).rejects.toThrow(/Only administrators/)
  })

  it("throws when the session user is STAFF", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "1", role: "STAFF" } })
    await expect(requireAdmin()).rejects.toThrow(/Only administrators/)
  })

  it("returns the user when the session user is ADMIN", async () => {
    const adminUser = { id: "1", role: "ADMIN" }
    authMock.mockResolvedValueOnce({ user: adminUser })
    await expect(requireAdmin()).resolves.toEqual(adminUser)
  })
})
