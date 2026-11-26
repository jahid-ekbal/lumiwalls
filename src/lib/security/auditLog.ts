import prisma from "@/lib/database/dbClient";
import type { Prisma } from "@generated/prisma/client";
import { getRequestIp } from "./rateLimit";

export type AuditEntryInput = {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAdminAuditLog(
  entry: AuditEntryInput,
): Promise<void> {
  try {
    const ipAddress = await getRequestIp();
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action.slice(0, 64),
        targetType: entry.targetType.slice(0, 32),
        targetId: entry.targetId.slice(0, 128),
        summary: entry.summary,
        ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to record admin audit log", error);
  }
}
