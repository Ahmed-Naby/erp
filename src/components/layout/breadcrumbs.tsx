"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, House } from "lucide-react"

import { cn } from "@/lib/utils"
import { navGroups } from "@/components/layout/nav-config"

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const crumbs: { label: string; href: string }[] = []
  for (const group of navGroups) {
    const item = group.items.find((i) => isActivePath(pathname, i.href))
    if (item) {
      crumbs.push({ label: group.label, href: item.href })
      crumbs.push({ label: item.label, href: item.href })
      break
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href="/dashboard"
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Home"
      >
        <House className="size-4" />
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={`${crumb.href}-${index}`} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground"
                )}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
