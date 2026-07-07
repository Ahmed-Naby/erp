"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { stockAdjustmentSchema } from "@/lib/validations/inventory"
import { adjustStock } from "@/services/stockService"

export async function recordStockAdjustment(input: unknown) {
  const data = stockAdjustmentSchema.parse(input)
  const session = await auth()

  await adjustStock({
    productId: data.productId,
    warehouseId: data.warehouseId,
    type: data.type,
    quantity: data.quantity,
    note: data.note,
    reference: "MANUAL",
    userId: session?.user?.id,
  })

  revalidatePath("/inventory/stock-movements")
  revalidatePath("/inventory/products")
  revalidatePath(`/inventory/products/${data.productId}`)
}
