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
import { getTranslations } from "@/lib/i18n/server"

export default async function UsersPage() {
  const session = await auth()
  const { t } = await getTranslations()
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
        </div>
        <UserForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("common.role")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                    <Badge variant="outline" className="ms-2">
                      {t("common.you")}
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
                    {u.active ? t("status.active") : t("status.inactive")}
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
                {t("users.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
