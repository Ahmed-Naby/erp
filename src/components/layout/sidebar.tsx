"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { navGroups } from "@/components/layout/nav-config"

export function Sidebar({ role, className }: { role: string; className?: string }) {
  const pathname = usePathname()
  const visibleGroups = navGroups.filter((group) => !group.adminOnly || role === "ADMIN")

  return (
    <aside
      className={cn(
        "hidden w-56 shrink-0 border-r bg-muted/20 md:flex md:flex-col",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="font-semibold">
          ERP
        </Link>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-xs font-medium uppercase text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
