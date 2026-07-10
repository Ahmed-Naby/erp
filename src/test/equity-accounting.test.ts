import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const { prisma } = await import("@/lib/prisma")
const { resetDb } = await import("@/test/helpers")
const { ACCOUNT_CODES } = await import("@/lib/accounts")
const { issueShares, deleteHolding, deleteShareholder } = await import(
  "@/app/(app)/equity/shareholders/actions"
)

/** Net movement (debit − credit) posted to an account across all journal lines. */
async function accountNet(code: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { code } })
  const lines = await prisma.journalLine.findMany({ where: { accountId: account.id } })
  return lines.reduce((sum, l) => sum + l.debit - l.credit, 0)
}

async function makeShareholderAndClass() {
  const shareholder = await prisma.shareholder.create({
    data: { name: `Holder ${Math.random()}`, type: "INDIVIDUAL" },
  })
  const shareClass = await prisma.shareClass.create({
    data: { name: `Class ${Math.random()}`, parValue: 1 },
  })
  return { shareholder, shareClass }
}

describe("equity issuance → accounting journal", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("posts debit Cash / credit Owner's Equity for the proceeds", async () => {
    const { shareholder, shareClass } = await makeShareholderAndClass()
    const cashBefore = await accountNet(ACCOUNT_CODES.CASH)
    const equityBefore = await accountNet(ACCOUNT_CODES.OWNERS_EQUITY)

    await issueShares({
      shareholderId: shareholder.id,
      shareClassId: shareClass.id,
      shares: 1000,
      pricePerShare: 5,
    })

    // 1000 × 5 = 5000 proceeds: Cash up 5000, Owner's Equity credited 5000.
    expect(await accountNet(ACCOUNT_CODES.CASH)).toBeCloseTo(cashBefore + 5000, 2)
    expect(await accountNet(ACCOUNT_CODES.OWNERS_EQUITY)).toBeCloseTo(equityBefore - 5000, 2)
  })

  it("reverses the entry when the holding is deleted (books net to zero)", async () => {
    const { shareholder, shareClass } = await makeShareholderAndClass()
    const cashBefore = await accountNet(ACCOUNT_CODES.CASH)
    const equityBefore = await accountNet(ACCOUNT_CODES.OWNERS_EQUITY)

    await issueShares({
      shareholderId: shareholder.id,
      shareClassId: shareClass.id,
      shares: 200,
      pricePerShare: 10,
    })
    const holding = await prisma.shareHolding.findFirstOrThrow({
      where: { shareholderId: shareholder.id },
    })
    await deleteHolding(holding.id)

    expect(await accountNet(ACCOUNT_CODES.CASH)).toBeCloseTo(cashBefore, 2)
    expect(await accountNet(ACCOUNT_CODES.OWNERS_EQUITY)).toBeCloseTo(equityBefore, 2)
  })

  it("reverses all posted issuances when a shareholder is deleted", async () => {
    const { shareholder, shareClass } = await makeShareholderAndClass()
    const cashBefore = await accountNet(ACCOUNT_CODES.CASH)

    await issueShares({
      shareholderId: shareholder.id,
      shareClassId: shareClass.id,
      shares: 300,
      pricePerShare: 4,
    })
    await deleteShareholder(shareholder.id)

    expect(await accountNet(ACCOUNT_CODES.CASH)).toBeCloseTo(cashBefore, 2)
  })

  it("does not post an entry for a zero-price grant", async () => {
    const { shareholder, shareClass } = await makeShareholderAndClass()
    const before = await prisma.journalEntry.count()

    await issueShares({
      shareholderId: shareholder.id,
      shareClassId: shareClass.id,
      shares: 50,
      pricePerShare: 0,
    })

    expect(await prisma.journalEntry.count()).toBe(before)
  })
})
