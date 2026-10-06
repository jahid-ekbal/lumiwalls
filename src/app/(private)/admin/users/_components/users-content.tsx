import UsersClient from "@/components/Admin/UsersClient";
import prisma from "@/lib/database/dbClient";
import type { UsersSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";

const PAGE_SIZE = 12;

type Props = {
  params: UsersSearchParamsType;
};

const UsersContent = async ({ params }: Props) => {
  const query = params.q.trim();
  const sortDirection = params.sort === "oldest" ? "asc" : "desc";

  const clauses: Prisma.UserWhereInput[] = [];
  if (query !== "") {
    clauses.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (params.role !== "all") {
    clauses.push({ role: params.role });
  }
  if (params.status === "banned") {
    clauses.push({ banned: true });
  } else if (params.status === "active") {
    clauses.push({ OR: [{ banned: false }, { banned: null }] });
  }
  const where: Prisma.UserWhereInput =
    clauses.length === 0 ? {}
    : clauses.length === 1 ? clauses[0]
    : { AND: clauses };

  const [total, totalAdmins, totalBanned, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { banned: true } }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: sortDirection },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        _count: { select: { wallpapers: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <UsersClient
      params={params}
      counts={{ total, totalAdmins, totalBanned }}
      totalPages={totalPages}
      users={rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        image: row.image,
        role: row.role ?? "user",
        banned: row.banned ?? false,
        banReason: row.banReason,
        banExpires: row.banExpires?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        wallpaperCount: row._count.wallpapers,
      }))}
    />
  );
};

export default UsersContent;
