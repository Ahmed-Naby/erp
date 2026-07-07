import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE"

export async function logAudit(
  input: {
    userId?: string
    userEmail: string
    action: AuditAction
    entityType: string
    entityId?: string
    summary: string
  },
  tx: Prisma.TransactionClient = prisma
) {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      userEmail: input.userEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
    },
  })
}
