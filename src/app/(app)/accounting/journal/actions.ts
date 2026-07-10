"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/rbac"
import { postJournalEntry } from "@/services/journalService"
import { manualJournalEntrySchema } from "@/lib/validations/accounting"

export async function createManualJournalEntry(input: unknown) {
  await requireAdmin()
  const data = manualJournalEntrySchema.parse(input)

  // Only forward lines that actually carry an amount.
  const lines = data.lines
    .filter((l) => (l.debit || 0) > 0 || (l.credit || 0) > 0)
    .map((l) => ({ accountCode: l.accountCode, debit: l.debit || 0, credit: l.credit || 0 }))

  await postJournalEntry({
    memo: data.memo || undefined,
    date: new Date(data.date),
    source: "MANUAL",
    lines,
  })

  revalidatePath("/accounting/journal")
  revalidatePath("/accounting/reports")
  revalidatePath("/accounting/trial-balance")
  revalidatePath("/accounting/balance-sheet")
}
