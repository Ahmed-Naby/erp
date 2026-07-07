import { auth } from "@/lib/auth"

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Only administrators can perform this action")
  }
  return session.user
}
