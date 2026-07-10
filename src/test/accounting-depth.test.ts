import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const authMock = vi.fn()
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }))

const { prisma } = await import("@/lib/prisma")
const { resetDb } = await import("@/test/helpers")
const { ACCOUNT_CODES } = await import("@/lib/accounts")
const { postJournalEntry, periodKey } = await import("@/services/journalService")
const { createManualJournalEntry } = await import("@/app/(app)/accounting/journal/actions")

describe("period locks", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("rejects a posting dated inside a locked period", async () => {
    await prisma.periodLock.create({ data: { period: "2020-01" } })
    await expect(
      postJournalEntry({
        date: new Date("2020-01-15"),
        lines: [
          { accountCode: ACCOUNT_CODES.CASH, debit: 100 },
          { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, credit: 100 },
        ],
      })
    ).rejects.toThrow(/locked/)
  })

  it("allows a posting in an unlocked period", async () => {
    const entry = await postJournalEntry({
      date: new Date("2020-02-15"),
      lines: [
        { accountCode: ACCOUNT_CODES.CASH, debit: 100 },
        { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, credit: 100 },
      ],
    })
    expect(entry.id).toBeTruthy()
    expect(periodKey(new Date("2020-02-15"))).toBe("2020-02")
  })
})

describe("manual journal entry", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("posts a balanced entry flagged MANUAL for an admin", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } })
    await createManualJournalEntry({
      date: "2024-05-10",
      memo: "test accrual",
      lines: [
        { accountCode: ACCOUNT_CODES.OPERATING_EXPENSES, debit: 300, credit: 0 },
        { accountCode: ACCOUNT_CODES.CASH, debit: 0, credit: 300 },
      ],
    })
    const entry = await prisma.journalEntry.findFirstOrThrow({
      where: { source: "MANUAL" },
      include: { lines: true },
    })
    const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
    const credit = entry.lines.reduce((s, l) => s + l.credit, 0)
    expect(debit).toBe(300)
    expect(credit).toBe(300)
  })

  it("rejects a non-admin", async () => {
    authMock.mockResolvedValue({ user: { id: "u2", role: "STAFF" } })
    await expect(
      createManualJournalEntry({
        date: "2024-05-11",
        lines: [
          { accountCode: ACCOUNT_CODES.CASH, debit: 50, credit: 0 },
          { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, debit: 0, credit: 50 },
        ],
      })
    ).rejects.toThrow(/administrator/i)
  })

  it("rejects an unbalanced manual entry at the validation layer", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } })
    await expect(
      createManualJournalEntry({
        date: "2024-05-12",
        lines: [
          { accountCode: ACCOUNT_CODES.CASH, debit: 100, credit: 0 },
          { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, debit: 0, credit: 90 },
        ],
      })
    ).rejects.toThrow()
  })
})
