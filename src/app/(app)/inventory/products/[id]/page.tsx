import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getTranslations()

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      stockItems: { include: { warehouse: true } },
      stockMovements: {
        include: { warehouse: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!product) notFound()

  const totalStock = product.stockItems.reduce((sum, s) => sum + s.quantity, 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <Badge variant={product.active ? "default" : "secondary"}>
            {product.active ? t("status.active") : t("status.inactive")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("products.sku")} {product.sku} · {product.category?.name ?? t("products.noCategory")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("products.totalStock")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalStock} {product.unit}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("products.costSalePrice")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {product.costPrice.toFixed(2)} / {product.salePrice.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("products.reorderLevel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {product.reorderLevel} {product.unit}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("products.taxRateLabel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {product.taxRate.toFixed(2)}%
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">{t("products.stockByWarehouse")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("stockMovements.warehouse")}</TableHead>
              <TableHead className="text-right">{t("common.quantity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.stockItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.warehouse.name}</TableCell>
                <TableCell className="text-right">
                  {item.quantity} {product.unit}
                </TableCell>
              </TableRow>
            ))}
            {product.stockItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  {t("products.noStock")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">{t("products.recentMovements")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("stockMovements.warehouse")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead className="text-right">{t("common.quantity")}</TableHead>
              <TableHead>{t("stockMovements.reference")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.stockMovements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {m.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>{m.warehouse.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{m.type}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right ${m.quantity < 0 ? "text-destructive" : "text-emerald-600"}`}
                >
                  {m.quantity > 0 ? "+" : ""}
                  {m.quantity}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.reference ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {product.stockMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("products.noMovements")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
