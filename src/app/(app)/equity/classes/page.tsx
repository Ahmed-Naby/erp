import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShareClassForm } from "@/components/equity/share-class-form"
import { ShareClassDelete } from "@/components/equity/share-class-delete"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "@/lib/i18n/server"

export default async function ShareClassesPage() {
  const { t } = await getTranslations()

  const classes = await prisma.shareClass.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { holdings: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("shareClasses.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("shareClasses.subtitle")}</p>
        </div>
        <ShareClassForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead className="text-right">{t("shareClasses.parValue")}</TableHead>
            <TableHead className="text-right">{t("shareClasses.issuances")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-right">{c.parValue.toFixed(2)}</TableCell>
              <TableCell className="text-right">{c._count.holdings}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <ShareClassForm
                    mode="edit"
                    classId={c.id}
                    triggerVariant="ghost"
                    defaultValues={{ name: c.name, parValue: c.parValue }}
                  />
                  <ShareClassDelete id={c.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {classes.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("shareClasses.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
