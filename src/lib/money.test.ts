import { describe, expect, it } from "vitest"

import { computeTotals } from "@/lib/money"

describe("computeTotals", () => {
  it("returns zeros for no lines", () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })

  it("computes subtotal/tax/total for a single taxed line", () => {
    expect(computeTotals([{ amount: 200, taxRate: 14 }])).toEqual({
      subtotal: 200,
      tax: 28,
      total: 228,
    })
  })

  it("treats zero tax rate as no tax", () => {
    expect(computeTotals([{ amount: 100, taxRate: 0 }])).toEqual({
      subtotal: 100,
      tax: 0,
      total: 100,
    })
  })

  it("sums multiple lines with different tax rates independently", () => {
    const result = computeTotals([
      { amount: 100, taxRate: 14 },
      { amount: 50, taxRate: 0 },
      { amount: 200, taxRate: 10 },
    ])
    expect(result.subtotal).toBe(350)
    expect(result.tax).toBeCloseTo(14 + 0 + 20, 10)
    expect(result.total).toBeCloseTo(384, 10)
  })

  it("handles fractional tax rates by rounding to the nearest cent", () => {
    const result = computeTotals([{ amount: 99.99, taxRate: 8.25 }])
    expect(result.subtotal).toBe(99.99)
    expect(result.tax).toBe(8.25)
    expect(result.total).toBe(108.24)
  })

  it("never produces floating-point drift in the results", () => {
    const result = computeTotals([{ amount: 200, taxRate: 14 }])
    expect(result.tax).toBe(28)
    expect(result.total).toBe(228)
  })
})
