import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
