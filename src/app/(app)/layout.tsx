import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { TopNav } from "@/components/layout/top-nav"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

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
    <div className="flex min-h-screen w-full flex-col">
      <TopNav
        role={session.user.role}
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
      />
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 print:hidden">
        <Breadcrumbs />
      </div>
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  )
}
