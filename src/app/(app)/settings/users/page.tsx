import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserForm } from "@/components/settings/user-form"
import { UserActiveToggle } from "@/components/settings/user-active-toggle"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export default async function UsersPage() {
  const session = await auth()
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage who can sign in and what they can access.
          </p>
        </div>
        <UserForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === session?.user.id
            return (
              <TableRow key={u.id}>
                <TableCell>
                  {u.name}
                  {isSelf && (
                    <Badge variant="outline" className="ml-2">
                      You
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "outline" : "destructive"}>
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <UserForm
                    mode="edit"
                    userId={u.id}
                    defaultValues={{ name: u.name, email: u.email, role: u.role as "ADMIN" | "STAFF" }}
                  />
                  {!isSelf && <UserActiveToggle id={u.id} active={u.active} />}
                </TableCell>
              </TableRow>
            )
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
