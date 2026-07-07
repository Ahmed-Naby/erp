import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomerForm } from "@/components/sales/customer-form"
import { prisma } from "@/lib/prisma"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { salesOrders: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            People and companies you sell to.
          </p>
        </div>
        <CustomerForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                No customers yet. Create your first one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
