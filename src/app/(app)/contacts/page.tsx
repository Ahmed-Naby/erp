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
import { prisma } from "@/lib/prisma"

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
  searchParams: Promise<{ view?: string; kind?: string }>
}) {
  const { view, kind } = await searchParams
  const activeView = view === "kanban" ? "kanban" : "list"
  const activeKind = kind === "customer" || kind === "vendor" ? kind : undefined

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

  const kinds: { key: "customer" | "vendor"; label: string }[] = [
    { key: "customer", label: "Customers" },
    { key: "vendor", label: "Vendors" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Your unified address book of customers and vendors.
          </p>
        </div>
        <ContactForm />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={["customer", "vendor"]} current={activeKind} paramName="kind" />
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
                      {c.phone ?? "No phone"} &middot; {c.docCount} docs
                    </p>
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Documents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((c) => (
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
                    {c.kind === "customer" ? "Customer" : "Vendor"}
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
                  No contacts yet. Create your first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
