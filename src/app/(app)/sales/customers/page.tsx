import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomerForm } from "@/components/sales/customer-form"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { pageArgs, pageCount, parsePage } from "@/lib/pagination"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { t } = await getTranslations()
  const [total, customers] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.findMany({
      include: { _count: { select: { salesOrders: true } } },
      orderBy: { name: "asc" },
      ...pageArgs(page),
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("customers.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("customers.subtitle")}</p>
        </div>
        <CustomerForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("common.phone")}</TableHead>
            <TableHead className="text-right">{t("customers.orders")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.email ?? "—"}</TableCell>
              <TableCell>{c.phone ?? "—"}</TableCell>
              <TableCell className="text-right">{c._count.salesOrders}</TableCell>
              <TableCell className="text-right">
                <CustomerForm
                  mode="edit"
                  customerId={c.id}
                  defaultValues={{
                    name: c.name,
                    email: c.email ?? "",
                    phone: c.phone ?? "",
                    address: c.address ?? "",
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("customers.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={pageCount(total)} />
    </div>
  )
}
