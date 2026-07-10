import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BomForm } from "@/components/manufacturing/bom-form"
import { BomDelete } from "@/components/manufacturing/bom-delete"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function BomsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const page = parsePage(pageParam)

  const [total, boms, products] = await Promise.all([
    prisma.bom.count(),
    prisma.bom.findMany({
      include: { product: true, lines: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("boms.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("boms.subtitle")}</p>
        </div>
        <BomForm products={products} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("boms.finishedProduct")}</TableHead>
            <TableHead className="text-right">{t("boms.producedQuantity")}</TableHead>
            <TableHead>{t("boms.components")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boms.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.product.name}</TableCell>
              <TableCell className="text-right">{b.quantity}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {b.lines.map((l) => `${l.product.name} ×${l.quantity}`).join(", ") || "—"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <BomForm
                    mode="edit"
                    bomId={b.id}
                    products={products}
                    triggerVariant="ghost"
                    defaultValues={{
                      productId: b.productId,
                      quantity: b.quantity,
                      lines: b.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
                    }}
                  />
                  <BomDelete id={b.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {boms.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("boms.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
