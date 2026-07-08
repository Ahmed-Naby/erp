"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid } from "lucide-react"

import { cn } from "@/lib/utils"
import { navGroups } from "@/components/layout/nav-config"
import { UserMenu } from "@/components/layout/user-menu"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslations } from "@/components/i18n/provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function TopNav({
  role,
  userName,
  userEmail,
}: {
  role: string
  userName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const t = useTranslations()
  const apps = navGroups.filter((group) => !group.adminOnly || role === "ADMIN")
  const currentApp =
    apps.find((group) => group.items.some((item) => isActivePath(pathname, item.href))) ??
    apps[0]

  return (
    <header className="sticky top-0 z-40 flex h-11 items-center gap-1 bg-brand-nav px-2 text-white print:hidden">
      {/* App switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("app.apps")}
          className="flex size-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/15"
        >
          <LayoutGrid className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[320px] p-3">
          <div className="grid grid-cols-3 gap-1">
            {apps.map((app) => {
              const Icon = app.icon
              return (
                <Link
                  key={app.label}
                  href={app.items[0].href}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      app.color
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs text-foreground">{t(app.label)}</span>
                </Link>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Current app name */}
      <Link
        href={currentApp.items[0].href}
        className="shrink-0 px-2 text-sm font-semibold whitespace-nowrap"
      >
        {t(currentApp.label)}
      </Link>

      {/* Current app menu items */}
      {currentApp.items.length > 1 && (
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {currentApp.items.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded px-2.5 py-1 text-sm whitespace-nowrap transition-colors hover:bg-white/15",
                  active ? "bg-white/20 font-medium" : "text-white/85"
                )}
              >
                {t(item.label)}
              </Link>
            )
          })}
        </nav>
      )}

      <div className="ms-auto flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <UserMenu name={userName} email={userEmail} role={role} onDark />
      </div>
    </header>
  )
}
