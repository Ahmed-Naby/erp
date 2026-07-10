"use server"

import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { ACCOUNT_CODES } from "@/lib/accounts"
import { postJournalEntry } from "@/services/journalService"
import { shareholderSchema, shareHoldingSchema } from "@/lib/validations/equity"

/** Journal reference for a share issuance, mirrors the EXP-/counter conventions. */
function holdingRef(id: string) {
  return `EQ-${id.slice(0, 8)}`
}

export async function createShareholder(input: unknown) {
  const data = shareholderSchema.parse(input)
  await prisma.shareholder.create({
    data: { name: data.name, email: data.email || null, type: data.type },
  })
  revalidatePath("/equity/shareholders")
}

export async function updateShareholder(id: string, input: unknown) {
  const data = shareholderSchema.parse(input)
  await prisma.shareholder.update({
    where: { id },
    data: { name: data.name, email: data.email || null, type: data.type },
  })
  revalidatePath("/equity/shareholders")
}

export async function deleteShareholder(id: string) {
  // Reverse any posted issuances so the books stay balanced, then delete the
  // shareholder (holdings cascade via the schema relation).
  const holdings = await prisma.shareHolding.findMany({
    where: { shareholderId: id, pricePerShare: { gt: 0 } },
    include: { shareholder: true },
  })
  await prisma.$transaction(async (tx) => {
    for (const h of holdings) {
      await reverseIssuanceEntry(tx, h.id, h.shares * h.pricePerShare, h.shareholder.name)
    }
    await tx.shareholder.delete({ where: { id } })
  })
  revalidatePath("/equity/shareholders")
  revalidatePath("/accounting/journal")
  revalidatePath("/accounting/reports")
}

export async function issueShares(input: unknown) {
  const data = shareHoldingSchema.parse(input)
  const proceeds = data.shares * data.pricePerShare

  await prisma.$transaction(async (tx) => {
    const holding = await tx.shareHolding.create({
      data: {
        shareholderId: data.shareholderId,
        shareClassId: data.shareClassId,
        shares: data.shares,
        pricePerShare: data.pricePerShare,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      },
      include: { shareholder: true },
    })

    // Cash comes in, owner's equity goes up (debit Cash, credit Owner's Equity).
    if (proceeds > 0) {
      await postJournalEntry(
        {
          memo: `Share issuance: ${holding.shareholder.name}`,
          reference: holdingRef(holding.id),
          lines: [
            { accountCode: ACCOUNT_CODES.CASH, debit: proceeds },
            { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, credit: proceeds },
          ],
        },
        tx
      )
    }
  })
  revalidatePath("/equity/shareholders")
  revalidatePath("/accounting/journal")
  revalidatePath("/accounting/reports")
}

export async function deleteHolding(id: string) {
  const holding = await prisma.shareHolding.findUniqueOrThrow({
    where: { id },
    include: { shareholder: true },
  })
  await prisma.$transaction(async (tx) => {
    await reverseIssuanceEntry(
      tx,
      holding.id,
      holding.shares * holding.pricePerShare,
      holding.shareholder.name
    )
    await tx.shareHolding.delete({ where: { id } })
  })
  revalidatePath("/equity/shareholders")
  revalidatePath("/accounting/journal")
  revalidatePath("/accounting/reports")
}

/**
 * Posts a reversing entry (debit Owner's Equity, credit Cash) for a share
 * issuance, but only if the original issuance actually posted one — detected by
 * looking up its EQ- reference. Keeps the ledger balanced when an issuance is
 * removed, and safely no-ops for zero-price or pre-existing (unposted) holdings.
 */
async function reverseIssuanceEntry(
  tx: Prisma.TransactionClient,
  holdingId: string,
  proceeds: number,
  shareholderName: string
) {
  if (proceeds <= 0) return
  const original = await tx.journalEntry.findFirst({
    where: { reference: holdingRef(holdingId) },
  })
  if (!original) return
  await postJournalEntry(
    {
      memo: `Reversal of share issuance: ${shareholderName}`,
      reference: holdingRef(holdingId),
      lines: [
        { accountCode: ACCOUNT_CODES.OWNERS_EQUITY, debit: proceeds },
        { accountCode: ACCOUNT_CODES.CASH, credit: proceeds },
      ],
    },
    tx
  )
}
