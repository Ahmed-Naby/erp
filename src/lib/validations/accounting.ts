import { z } from "zod"

// Manual journal entry — hand-posted balanced double entry.
export const manualJournalLineSchema = z
  .object({
    accountCode: z.string().min(1, "Account is required"),
    debit: z.coerce.number().min(0, "Must be 0 or more"),
    credit: z.coerce.number().min(0, "Must be 0 or more"),
  })
  .refine((l) => !(l.debit > 0 && l.credit > 0), {
    message: "A line can't have both a debit and a credit",
    path: ["debit"],
  })

export const manualJournalEntrySchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    memo: z.string().optional(),
    lines: z.array(manualJournalLineSchema).min(2, "At least two lines are required"),
  })
  .refine(
    (e) => {
      const debit = e.lines.reduce((s, l) => s + (l.debit || 0), 0)
      const credit = e.lines.reduce((s, l) => s + (l.credit || 0), 0)
      return debit > 0 && Math.abs(debit - credit) < 0.01
    },
    { message: "Debits and credits must balance and be greater than zero", path: ["lines"] }
  )
export type ManualJournalEntryInput = z.infer<typeof manualJournalEntrySchema>

// Bank statement line — signed amount (+ deposit / − withdrawal).
export const bankStatementLineSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().refine((v) => v !== 0, "Amount can't be zero"),
})
export type BankStatementLineInput = z.infer<typeof bankStatementLineSchema>

// Period lock — a "YYYY-MM" fiscal month.
export const periodLockSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Use the YYYY-MM format"),
  note: z.string().optional(),
})
export type PeriodLockInput = z.infer<typeof periodLockSchema>
