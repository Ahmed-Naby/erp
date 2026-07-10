import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getTranslations } from "@/lib/i18n/server"

/**
 * A plain GET form for filtering a report by date range. Server-rendered — no
 * client JS; submitting reloads the page with ?from&to search params.
 */
export async function DateRangeFilter({
  from,
  to,
  action,
}: {
  from?: string
  to?: string
  action: string
}) {
  const { t } = await getTranslations()
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">{t("reports.from")}</span>
        <Input type="date" name="from" defaultValue={from} className="w-40" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">{t("reports.to")}</span>
        <Input type="date" name="to" defaultValue={to} className="w-40" />
      </label>
      <Button type="submit" variant="outline">{t("reports.apply")}</Button>
    </form>
  )
}
