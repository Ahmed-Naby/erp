import { prisma } from "@/lib/prisma"
import { ACCOUNT_CODES } from "@/lib/accounts"
import type { Prisma } from "@prisma/client"

async function nextEntryNumber(count: () => Promise<number>) {
  const n = (await count()) + 1
  return `JE-${String(n).padStart(6, "0")}`
}

type JournalLineInput = {
  accountCode: string
  debit?: number
  credit?: number
}

export type PostJournalEntryInput = {
  memo?: string
  reference?: string
  lines: JournalLineInput[]
}

/**
 * Posts a balanced double-entry journal entry. Throws if debits and
 * credits don't sum to the same total (within floating point tolerance).
 */
export async function postJournalEntry(
  input: PostJournalEntryInput,
  tx: Prisma.TransactionClient = prisma
) {
  const totalDebit = input.lines.reduce((sum, l) => sum + (l.debit ?? 0), 0)
  const totalCredit = input.lines.reduce((sum, l) => sum + (l.credit ?? 0), 0)
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Journal entry is not balanced: debits ${totalDebit} != credits ${totalCredit}`
    )
  }

  const run = async (client: Prisma.TransactionClient) => {
    const entryNumber = await nextEntryNumber(() => client.journalEntry.count())

    const accounts = await client.account.findMany({
      where: { code: { in: input.lines.map((l) => l.accountCode) } },
    })
    const accountByCode = new Map(accounts.map((a) => [a.code, a]))

    return client.journalEntry.create({
      data: {
        entryNumber,
        memo: input.memo,
        reference: input.reference,
        lines: {
          create: input.lines.map((l) => {
            const account = accountByCode.get(l.accountCode)
            if (!account) {
              throw new Error(`Unknown account code: ${l.accountCode}`)
            }
            return {
              accountId: account.id,
              debit: l.debit ?? 0,
              credit: l.credit ?? 0,
            }
          }),
        },
      },
      include: { lines: true },
    })
  }

  if (tx !== prisma) return run(tx)
  return prisma.$transaction((trx) => run(trx))
}

export async function postInvoiceEntries(
  input: {
    invoiceNumber: string
    totalAmount: number
    taxAmount: number
    costOfGoods: number
  },
  tx: Prisma.TransactionClient
) {
  const netRevenue = input.totalAmount - input.taxAmount
  const lines: JournalLineInput[] = [
    { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, debit: input.totalAmount },
    { accountCode: ACCOUNT_CODES.SALES_REVENUE, credit: netRevenue },
  ]
  if (input.taxAmount > 0) {
    lines.push({ accountCode: ACCOUNT_CODES.TAX_PAYABLE, credit: input.taxAmount })
  }
  await postJournalEntry(
    {
      reference: input.invoiceNumber,
      memo: `Invoice ${input.invoiceNumber}`,
      lines,
    },
    tx
  )

  if (input.costOfGoods > 0) {
    await postJournalEntry(
      {
        reference: input.invoiceNumber,
        memo: `COGS for invoice ${input.invoiceNumber}`,
        lines: [
          { accountCode: ACCOUNT_CODES.COST_OF_GOODS_SOLD, debit: input.costOfGoods },
          { accountCode: ACCOUNT_CODES.INVENTORY, credit: input.costOfGoods },
        ],
      },
      tx
    )
  }
}

export async function postPurchaseReceiptEntries(
  input: { poNumber: string; subtotal: number; taxAmount: number },
  tx: Prisma.TransactionClient
) {
  const total = input.subtotal + input.taxAmount
  if (total <= 0) return
  const lines: JournalLineInput[] = [
    { accountCode: ACCOUNT_CODES.INVENTORY, debit: input.subtotal },
  ]
  if (input.taxAmount > 0) {
    lines.push({ accountCode: ACCOUNT_CODES.TAX_RECEIVABLE, debit: input.taxAmount })
  }
  lines.push({ accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, credit: total })
  await postJournalEntry(
    {
      reference: input.poNumber,
      memo: `Received purchase order ${input.poNumber}`,
      lines,
    },
    tx
  )
}

export async function postPaymentEntries(
  input: { paymentNumber: string; type: "RECEIVED" | "PAID"; amount: number },
  tx: Prisma.TransactionClient
) {
  const lines =
    input.type === "RECEIVED"
      ? [
          { accountCode: ACCOUNT_CODES.CASH, debit: input.amount },
          { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, credit: input.amount },
        ]
      : [
          { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: input.amount },
          { accountCode: ACCOUNT_CODES.CASH, credit: input.amount },
        ]

  await postJournalEntry(
    {
      reference: input.paymentNumber,
      memo: `Payment ${input.paymentNumber}`,
      lines,
    },
    tx
  )
}
