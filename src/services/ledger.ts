import { prisma } from "@/lib/prisma"

export type DateRange = { from?: Date; to?: Date }

export type AccountBalance = {
  code: string
  name: string
  type: string
  debit: number
  credit: number
  /** Net on the account's normal side (debit-normal for ASSET/EXPENSE). */
  balance: number
}

const DEBIT_NORMAL = new Set(["ASSET", "EXPENSE"])

/** Parses ?from / ?to search params into a DateRange (to is end-of-day). */
export function parseDateRange(params: { from?: string; to?: string }): DateRange {
  const range: DateRange = {}
  if (params.from) {
    const d = new Date(params.from)
    if (!Number.isNaN(d.getTime())) range.from = d
  }
  if (params.to) {
    const d = new Date(params.to)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      range.to = d
    }
  }
  return range
}

/**
 * Aggregates every posted journal line into per-account debit/credit totals
 * and a signed balance on the account's normal side. Only accounts with
 * activity in the range are returned, sorted by code.
 */
export async function accountBalances(range: DateRange = {}): Promise<AccountBalance[]> {
  const dateFilter = {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  }
  const lines = await prisma.journalLine.findMany({
    where:
      range.from || range.to ? { journalEntry: { date: dateFilter } } : undefined,
    include: { account: true },
  })

  const byCode = new Map<string, AccountBalance>()
  for (const line of lines) {
    const a = line.account
    const row =
      byCode.get(a.code) ?? { code: a.code, name: a.name, type: a.type, debit: 0, credit: 0, balance: 0 }
    row.debit += line.debit
    row.credit += line.credit
    byCode.set(a.code, row)
  }

  const rows = [...byCode.values()]
  for (const row of rows) {
    row.balance = DEBIT_NORMAL.has(row.type)
      ? row.debit - row.credit
      : row.credit - row.debit
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code))
}
