import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WarehouseForm } from "@/components/inventory/warehouse-form"
import { prisma } from "@/lib/prisma"

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    include: { stockItems: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warehouses</h1>
          <p className="text-sm text-muted-foreground">
            Locations where stock is held.
          </p>
        </div>
        <WarehouseForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Distinct Products</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((w) => (
            <TableRow key={w.id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.location ?? "—"}</TableCell>
              <TableCell className="text-right">{w.stockItems.length}</TableCell>
              <TableCell className="text-right">
                <WarehouseForm
                  mode="edit"
                  warehouseId={w.id}
                  defaultValues={{ name: w.name, location: w.location ?? "" }}
                />
              </TableCell>
            </TableRow>
          ))}
          {warehouses.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No warehouses yet. Create your first one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
