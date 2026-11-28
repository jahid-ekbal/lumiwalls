import AuditLogClient from "@/components/Admin/AuditLogClient";
import { requireAdminUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import type { AuditLogSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";

const PAGE_SIZE = 20;

type Props = {
  params: AuditLogSearchParamsType;
};

const AuditContent = async ({ params }: Props) => {
  await requireAdminUser();

  const query = params.q.trim();
  const clauses: Prisma.AdminAuditLogWhereInput[] = [];

  if (query !== "") {
    clauses.push({
      OR: [
        { summary: { contains: query, mode: "insensitive" } },
        { targetId: { contains: query, mode: "insensitive" } },
        { actor: { name: { contains: query, mode: "insensitive" } } },
        { actor: { email: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  if (params.action !== "all") {
    clauses.push({ action: params.action });
  }

  const where: Prisma.AdminAuditLogWhereInput =
    clauses.length === 0 ? {}
    : clauses.length === 1 ? clauses[0]
    : { AND: clauses };

  const [total, rows, actionRows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        summary: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.adminAuditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AuditLogClient
      params={params}
      total={total}
      totalPages={totalPages}
      actions={actionRows.map((row) => row.action)}
      entries={rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        summary: row.summary,
        metadata:
          row.metadata === null ? null : JSON.stringify(row.metadata, null, 2),
        ipAddress: row.ipAddress,
        createdAt: row.createdAt.toISOString(),
        actor: row.actor,
      }))}
    />
  );
};

export default AuditContent;
