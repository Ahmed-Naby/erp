export type TaxableLine = { amount: number; taxRate: number }

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeTotals(lines: TaxableLine[]) {
  const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
  const tax = roundToCents(
    lines.reduce((sum, l) => sum + l.amount * (l.taxRate / 100), 0)
  )
  return { subtotal, tax, total: roundToCents(subtotal + tax) }
}
