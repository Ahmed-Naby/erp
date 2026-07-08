import { cn } from "@/lib/utils"

function toTitle(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

/**
 * Odoo-style workflow "statusbar" ribbon. Shows the ordered pipeline stages
 * with everything up to and including the current stage highlighted. An
 * off-pipeline terminal state (e.g. CANCELLED) is shown as a single red pill
 * via `exceptionStatus`.
 */
export function StatusBar({
  stages,
  current,
  exceptionStatus,
}: {
  stages: string[]
  current: string
  exceptionStatus?: string
}) {
  if (exceptionStatus && current === exceptionStatus) {
    return (
      <div className="inline-flex items-center rounded-md bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive ring-1 ring-destructive/20">
        {toTitle(current)}
      </div>
    )
  }

  const currentIndex = stages.indexOf(current)

  return (
    <div className="inline-flex overflow-hidden rounded-md ring-1 ring-border">
      {stages.map((stage, index) => {
        const reached = index <= currentIndex
        const isCurrent = index === currentIndex
        return (
          <div
            key={stage}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "px-3 py-1 text-xs font-medium whitespace-nowrap",
              index > 0 && "border-l border-border/60",
              isCurrent
                ? "bg-primary text-primary-foreground"
                : reached
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {toTitle(stage)}
          </div>
        )
      })}
    </div>
  )
}
