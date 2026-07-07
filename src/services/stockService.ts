import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

type StockMovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER"

export type AdjustStockInput = {
  productId: string
  warehouseId: string
  type: StockMovementType
  /**
   * For IN/OUT this is the unsigned movement amount. For ADJUST this is the
   * target absolute quantity (the delta is computed against current stock).
   */
  quantity: number
  reference?: string
  note?: string
  userId?: string
}

/**
 * Applies a stock movement and updates the StockItem balance in one
 * transaction. StockMovement.quantity is stored as a signed delta (positive
 * for increases, negative for decreases) so movement history can be summed
 * directly to reconstruct balances.
 */
export async function adjustStock(
  input: AdjustStockInput,
  tx: Prisma.TransactionClient = prisma
) {
  const run = async (client: Prisma.TransactionClient) => {
    const stockItem = await client.stockItem.upsert({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
      create: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: 0,
      },
      update: {},
    })

    let delta: number
    if (input.type === "IN") {
      delta = input.quantity
    } else if (input.type === "OUT") {
      delta = -input.quantity
    } else if (input.type === "ADJUST") {
      delta = input.quantity - stockItem.quantity
    } else {
      delta = 0
    }

    const newQuantity = stockItem.quantity + delta
    if (newQuantity < 0) {
      throw new Error(
        `Insufficient stock: only ${stockItem.quantity} available`
      )
    }

    await client.stockItem.update({
      where: { id: stockItem.id },
      data: { quantity: newQuantity },
    })

    await client.stockMovement.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: input.type,
        quantity: delta,
        reference: input.reference,
        note: input.note,
        createdById: input.userId,
      },
    })

    return newQuantity
  }

  if (tx !== prisma) return run(tx)
  return prisma.$transaction((trx) => run(trx))
}

export async function getProductTotalStock(productId: string) {
  const result = await prisma.stockItem.aggregate({
    where: { productId },
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
}
