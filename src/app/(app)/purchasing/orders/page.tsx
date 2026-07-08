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
import { Button } from "@/components/ui/button"
import { StatusFilter } from "@/components/shared/status-filter"
import { ViewSwitcher } from "@/components/shared/view-switcher"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { computeTotals } from "@/lib/money"
import { prisma } from "@/lib/prisma"

const STATUSES = ["DRAFT", "SENT", "RECEIVED", "CANCELLED"]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  RECEIVED: "default",
  CANCELLED: "destructive",
}

const statusAccent: Record<string, string> = {
  DRAFT: "bg-slate-400",
  SENT: "bg-amber-500",
  RECEIVED: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
}

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string }>
}) {
  const { view, status } = await searchParams
  const activeView = view === "kanban" ? "kanban" : "list"
  const activeStatus = status && STATUSES.includes(status) ? status : undefined

  const orders = await prisma.purchaseOrder.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    include: { supplier: true, lines: true },
    orderBy: { createdAt: "desc" },
  })

  const totalFor = (lines: { quantity: number; unitCost: number; taxRate: number }[]) =>
    computeTotals(lines.map((l) => ({ amount: l.quantity * l.unitCost, taxRate: l.taxRate }))).total

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Orders placed with suppliers.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/purchasing/orders/new" />}>
          New Order
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter statuses={STATUSES} current={activeStatus} />
        <ViewSwitcher current={activeView} />
      </div>

      {activeView === "kanban" ? (
        <KanbanBoard>
          {STATUSES.map((s) => {
            const items = orders.filter((o) => o.status === s)
            return (
              <KanbanColumn key={s} title={s.charAt(0) + s.slice(1).toLowerCase()} count={items.length} accent={statusAccent[s]}>
                {items.map((o) => (
                  <KanbanCard key={o.id} href={`/purchasing/orders/${o.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{o.poNumber}</span>
                      <span className="text-sm text-muted-foreground">
                        {totalFor(o.lines).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{o.supplier.name}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {o.orderDate.toLocaleDateString()} &middot; {o.lines.length} lines
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
              <TableHead>Order #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/purchasing/orders/${o.id}`} className="font-medium hover:underline">
                    {o.poNumber}
                  </Link>
                </TableCell>
                <TableCell>{o.supplier.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[o.status] ?? "outline"}>{o.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{o.lines.length}</TableCell>
                <TableCell className="text-right">{totalFor(o.lines).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.orderDate.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {activeStatus
                    ? "No orders with this status."
                    : "No purchase orders yet. Create your first one."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
