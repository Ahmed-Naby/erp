"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { manufacturingOrderSchema } from "@/lib/validations/supply-chain"
import { nextSequence } from "@/services/counter"
import { adjustStock } from "@/services/stockService"

function relId(value?: string) {
  return value && value !== "none" ? value : null
}

export async function createManufacturingOrder(input: unknown) {
  const data = manufacturingOrderSchema.parse(input)
  await prisma.$transaction(async (tx) => {
    const moNumber = await nextSequence("manufacturingOrder", "MO", tx)
    await tx.manufacturingOrder.create({
      data: {
        moNumber,
        productId: data.productId,
        quantity: data.quantity,
        warehouseId: data.warehouseId,
        bomId: relId(data.bomId),
      },
    })
  })
  revalidatePath("/manufacturing/orders")
}

export async function updateManufacturingOrder(id: string, input: unknown) {
  const data = manufacturingOrderSchema.parse(input)
  const existing = await prisma.manufacturingOrder.findUniqueOrThrow({ where: { id } })
  if (existing.status !== "DRAFT") {
    throw new Error("Only draft orders can be edited")
  }
  await prisma.manufacturingOrder.update({
    where: { id },
    data: {
      productId: data.productId,
      quantity: data.quantity,
      warehouseId: data.warehouseId,
      bomId: relId(data.bomId),
    },
  })
  revalidatePath("/manufacturing/orders")
}

const VALID = ["DRAFT", "CONFIRMED", "DONE", "CANCELLED"]

export async function setManufacturingOrderStatus(id: string, status: string) {
  if (!VALID.includes(status)) throw new Error("Invalid status")

  if (status === "DONE") {
    const mo = await prisma.manufacturingOrder.findUniqueOrThrow({
      where: { id },
      include: { bom: { include: { lines: true } } },
    })
    if (mo.status === "DONE") throw new Error("Order already completed")
    if (mo.status !== "CONFIRMED") throw new Error("Only confirmed orders can be completed")

    await prisma.$transaction(async (tx) => {
      // Consume raw components per the bill of materials (scaled to MO quantity).
      if (mo.bom) {
        const ratio = mo.quantity / (mo.bom.quantity || 1)
        for (const line of mo.bom.lines) {
          await adjustStock(
            {
              productId: line.productId,
              warehouseId: mo.warehouseId,
              type: "OUT",
              quantity: line.quantity * ratio,
              reference: mo.moNumber,
              note: "Manufacturing consumption",
            },
            tx
          )
        }
      }
      // Produce the finished goods.
      await adjustStock(
        {
          productId: mo.productId,
          warehouseId: mo.warehouseId,
          type: "IN",
          quantity: mo.quantity,
          reference: mo.moNumber,
          note: "Manufacturing output",
        },
        tx
      )
      await tx.manufacturingOrder.update({ where: { id }, data: { status: "DONE" } })
    })
    revalidatePath("/inventory/products")
    revalidatePath("/inventory/stock-movements")
  } else {
    await prisma.manufacturingOrder.update({ where: { id }, data: { status } })
  }
  revalidatePath("/manufacturing/orders")
}
