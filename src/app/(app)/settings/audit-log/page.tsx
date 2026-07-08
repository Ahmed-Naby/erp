import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
}

export default async function AuditLogPage() {
  const { t } = await getTranslations()
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("audit.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("audit.subtitle")}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("audit.when")}</TableHead>
            <TableHead>{t("audit.user")}</TableHead>
            <TableHead>{t("audit.action")}</TableHead>
            <TableHead>{t("audit.entity")}</TableHead>
            <TableHead>{t("audit.summary")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {e.createdAt.toLocaleString()}
              </TableCell>
              <TableCell>{e.userEmail}</TableCell>
              <TableCell>
                <Badge variant={actionVariant[e.action] ?? "outline"}>{e.action}</Badge>
              </TableCell>
              <TableCell>
                {e.entityType}
                {e.entityId ? ` #${e.entityId.slice(0, 8)}` : ""}
              </TableCell>
              <TableCell className="text-sm">{e.summary}</TableCell>
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("audit.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
