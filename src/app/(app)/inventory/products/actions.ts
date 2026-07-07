"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { categorySchema, productSchema } from "@/lib/validations/inventory"

export async function createProduct(input: unknown) {
  const data = productSchema.parse(input)

  await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      categoryId: data.categoryId || null,
      unit: data.unit,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      reorderLevel: data.reorderLevel,
      taxRate: data.taxRate,
    },
  })

  revalidatePath("/inventory/products")
}

export async function updateProduct(id: string, input: unknown) {
  const data = productSchema.parse(input)

  await prisma.product.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      categoryId: data.categoryId || null,
      unit: data.unit,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      reorderLevel: data.reorderLevel,
      taxRate: data.taxRate,
    },
  })

  revalidatePath("/inventory/products")
  revalidatePath(`/inventory/products/${id}`)
}

export async function toggleProductActive(id: string, active: boolean) {
  await prisma.product.update({ where: { id }, data: { active } })
  revalidatePath("/inventory/products")
}

export async function createCategory(input: unknown) {
  const data = categorySchema.parse(input)
  await prisma.category.create({ data: { name: data.name } })
  revalidatePath("/inventory/products")
}

export async function deleteCategory(id: string) {
  const inUse = await prisma.product.count({ where: { categoryId: id } })
  if (inUse > 0) {
    throw new Error("Cannot delete a category that has products assigned")
  }
  await prisma.category.delete({ where: { id } })
  revalidatePath("/inventory/products")
}
