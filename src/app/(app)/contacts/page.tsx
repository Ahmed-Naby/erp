import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ContactForm } from "@/components/contacts/contact-form"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { Pagination } from "@/components/shared/pagination"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"
import { PAGE_SIZE, pageCount, parsePage } from "@/lib/pagination"

type ContactRow = {
  id: string
  kind: "customer" | "vendor"
  name: string
  email: string | null
  phone: string | null
  address: string | null
  docCount: number
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; kind?: string; page?: string }>
}) {
  const { view, kind, page: pageParam } = await searchParams
  const { t } = await getTranslations()
  const activeView = view === "kanban" ? "kanban" : "list"
  const activeKind = kind === "customer" || kind === "vendor" ? kind : undefined
  const page = parsePage(pageParam)

  const [customers, suppliers] = await Promise.all([
    activeKind === "vendor"
      ? Promise.resolve([])
      : prisma.customer.findMany({
          include: { _count: { select: { salesOrders: true } } },
          orderBy: { name: "asc" },
        }),
    activeKind === "customer"
      ? Promise.resolve([])
      : prisma.supplier.findMany({
          include: { _count: { select: { purchaseOrders: true } } },
          orderBy: { name: "asc" },
        }),
  ])

  const contacts: ContactRow[] = [
    ...customers.map((c) => ({
      id: c.id,
      kind: "customer" as const,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      docCount: c._count.salesOrders,
    })),
    ...suppliers.map((s) => ({
      id: s.id,
      kind: "vendor" as const,
      name: s.name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      docCount: s._count.purchaseOrders,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name))

  const pagedContacts = contacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kinds: { key: "customer" | "vendor"; label: string }[] = [
    { key: "customer", label: t("contacts.customers") },
    { key: "vendor", label: t("contacts.vendors") },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("contacts.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("contacts.subtitle")}</p>
        </div>
        <ContactForm />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter
          statuses={["customer", "vendor"]}
          current={activeKind}
          paramName="kind"
          tPrefix="kind"
        />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {kinds.map(({ key, label }) => {
            const items = contacts.filter((c) => c.kind === key)
            return (
              <KanbanColumn
                key={key}
                title={label}
                count={items.length}
                accent={key === "customer" ? "bg-violet-500" : "bg-teal-500"}
              >
                {items.map((c) => (
                  <KanbanCard key={`${c.kind}-${c.id}`} href={`/contacts/${c.kind}/${c.id}`}>
                    <div className="font-medium">{c.name}</div>
                    {c.email && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">{c.email}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.phone ?? t("contacts.noPhone")} &middot;{" "}
                      {t("contacts.docsCount", { n: c.docCount })}
                    </p>
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      ) : (
        <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("common.phone")}</TableHead>
              <TableHead className="text-right">{t("contacts.documents")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedContacts.map((c) => (
              <TableRow key={`${c.kind}-${c.id}`}>
                <TableCell>
                  <Link
                    href={`/contacts/${c.kind}/${c.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={c.kind === "customer" ? "default" : "secondary"}>
                    {c.kind === "customer" ? t("kind.customer") : t("kind.vendor")}
                  </Badge>
                </TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right">{c.docCount}</TableCell>
              </TableRow>
            ))}
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("contacts.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={pageCount(contacts.length)} />
        </div>
      )}
    </div>
  )
}
