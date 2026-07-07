import { beforeAll, describe, expect, it } from "vitest"

import { prisma } from "@/lib/prisma"
import { resetDb } from "@/test/helpers"
import { ACCOUNT_CODES } from "@/lib/accounts"
import { postJournalEntry } from "@/services/journalService"

describe("postJournalEntry", () => {
  beforeAll(async () => {
    await resetDb()
  })

  it("posts a balanced entry with matching debit/credit lines", async () => {
    const entry = await postJournalEntry({
      memo: "test balanced entry",
      lines: [
        { accountCode: ACCOUNT_CODES.CASH, debit: 100 },
        { accountCode: ACCOUNT_CODES.SALES_REVENUE, credit: 100 },
      ],
    })
    expect(entry.lines).toHaveLength(2)
    const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
    const credit = entry.lines.reduce((s, l) => s + l.credit, 0)
    expect(debit).toBe(credit)
  })

  it("throws when debits and credits don't balance", async () => {
    await expect(
      postJournalEntry({
        memo: "unbalanced entry",
        lines: [
          { accountCode: ACCOUNT_CODES.CASH, debit: 100 },
          { accountCode: ACCOUNT_CODES.SALES_REVENUE, credit: 90 },
        ],
      })
    ).rejects.toThrow(/not balanced/)
  })

  it("throws for an unknown account code", async () => {
    await expect(
      postJournalEntry({
        memo: "bad account",
        lines: [
          { accountCode: "NOPE", debit: 10 },
          { accountCode: ACCOUNT_CODES.CASH, credit: 10 },
        ],
      })
    ).rejects.toThrow(/Unknown account code/)
  })

  it("does not persist a journal entry when the transaction throws", async () => {
    const before = await prisma.journalEntry.count()
    await postJournalEntry({
      memo: "should roll back",
      lines: [
        { accountCode: "NOPE", debit: 10 },
        { accountCode: ACCOUNT_CODES.CASH, credit: 10 },
      ],
    }).catch(() => {})
    const after = await prisma.journalEntry.count()
    expect(after).toBe(before)
  })
})
