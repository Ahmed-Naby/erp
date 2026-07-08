import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

/**
 * Atomically allocates the next value for a named counter and formats it as a
 * zero-padded document number, e.g. nextSequence("salesOrder", "SO") -> "SO-000042".
 *
 * The `UPDATE ... SET value = value + 1 RETURNING value` is a single atomic
 * statement that takes a row lock, so concurrent callers never receive the same
 * number (unlike the old count()+1 approach). The counter row must exist — all
 * keys are created/baselined by the seed's ensureCounters().
 */
export async function nextSequence(
  key: string,
  prefix: string,
  tx: Prisma.TransactionClient = prisma
) {
  const counter = await tx.counter.update({
    where: { key },
    data: { value: { increment: 1 } },
  })
  return `${prefix}-${String(counter.value).padStart(6, "0")}`
}
