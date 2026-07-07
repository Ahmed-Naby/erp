import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { UserMenu } from "@/components/layout/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen w-full flex-1">
      <Sidebar className="print:hidden" role={session.user.role} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 print:hidden">
          <span className="text-sm text-muted-foreground">
            Welcome back, {session.user.name}
          </span>
          <UserMenu
            name={session.user.name ?? "User"}
            email={session.user.email ?? ""}
            role={session.user.role}
          />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
