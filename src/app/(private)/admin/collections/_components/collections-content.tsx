import CollectionsClient from "@/components/Admin/CollectionsClient";
import prisma from "@/lib/database/dbClient";
import type { CollectionsSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";

const PAGE_SIZE = 12;

type Props = {
  params: CollectionsSearchParamsType;
};

const CollectionsContent = async ({ params }: Props) => {
  const query = params.q.trim();

  const clauses: Prisma.CollectionWhereInput[] = [];
  if (query !== "") {
    clauses.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (params.status === "active") {
    clauses.push({ active: true });
  } else if (params.status === "hidden") {
    clauses.push({ active: false });
  }
  const where: Prisma.CollectionWhereInput =
    clauses.length === 0 ? {}
    : clauses.length === 1 ? clauses[0]
    : { AND: clauses };

  const orderBy: Prisma.CollectionOrderByWithRelationInput[] =
    params.sort === "newest" ?
      [{ createdAt: "desc" }]
    : [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const [total, activeCount, rows] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { active: true } }),
    prisma.collection.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        curator: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <CollectionsClient
      params={params}
      counts={{ total, active: activeCount }}
      totalPages={totalPages}
      collections={rows.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        coverUrl: item.coverUrl,
        active: item.active,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
        itemCount: item._count.items,
        curator:
          item.curator ?
            {
              id: item.curator.id,
              name: item.curator.name,
              email: item.curator.email,
            }
          : null,
      }))}
    />
  );
};

export default CollectionsContent;
