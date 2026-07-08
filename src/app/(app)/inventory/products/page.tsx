import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoryManager } from "@/components/inventory/category-manager"
import { ProductActiveToggle } from "@/components/inventory/product-active-toggle"
import { ProductForm } from "@/components/inventory/product-form"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()
  const [total, products, categories] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      include: {
        category: true,
        stockItems: true,
      },
      orderBy: { name: "asc" },
      ...pageArgs(page),
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("products.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("products.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <CategoryManager categories={categories} />
          <ProductForm categories={categories} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("products.sku")}</TableHead>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("products.category")}</TableHead>
            <TableHead className="text-right">{t("products.stock")}</TableHead>
            <TableHead className="text-right">{t("products.costPrice")}</TableHead>
            <TableHead className="text-right">{t("products.salePrice")}</TableHead>
            <TableHead className="text-right">{t("products.taxRate")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const totalStock = product.stockItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )
            const isLow = totalStock <= product.reorderLevel

            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-xs">
                  {product.sku}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/inventory/products/${product.id}`}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>{product.category?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <span className={isLow ? "font-medium text-destructive" : ""}>
                    {totalStock} {product.unit}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {product.costPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {product.salePrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {product.taxRate.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? t("status.active") : t("status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ProductForm
                    categories={categories}
                    mode="edit"
                    productId={product.id}
                    defaultValues={{
                      sku: product.sku,
                      name: product.name,
                      categoryId: product.categoryId ?? "",
                      unit: product.unit,
                      costPrice: product.costPrice,
                      salePrice: product.salePrice,
                      reorderLevel: product.reorderLevel,
                      taxRate: product.taxRate,
                    }}
                  />
                  <ProductActiveToggle id={product.id} active={product.active} />
                </TableCell>
              </TableRow>
            )
          })}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                {t("products.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
