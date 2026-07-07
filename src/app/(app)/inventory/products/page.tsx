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
import { prisma } from "@/lib/prisma"

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        stockItems: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog and stock levels.
          </p>
        </div>
        <div className="flex gap-2">
          <CategoryManager categories={categories} />
          <ProductForm categories={categories} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Sale Price</TableHead>
            <TableHead className="text-right">Tax %</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                    {product.active ? "Active" : "Inactive"}
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
                No products yet. Create your first one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
