import CollectionsDirectoryClient from "@/components/Collections/CollectionsDirectoryClient";
import PageHeader from "@/components/UI/PageHeader";
import { buttonVariants } from "@/components/shadcnui/button";
import { requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { collectionsDirectoryParamsSchema } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";
import { CompassIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Collections",
  description: "Explore curated wallpaper collections and your personal boards",
});

const PAGE_SIZE = 12;

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const CollectionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await requireActiveUser();
  const raw = await searchParams;
  const parsed = collectionsDirectoryParamsSchema.safeParse({
    tab: firstParam(raw.tab),
    q: firstParam(raw.q),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : collectionsDirectoryParamsSchema.parse({});

  const query = params.q.trim();
  const searchClause: Prisma.CollectionWhereInput =
    query ?
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const curatedWhere: Prisma.CollectionWhereInput = {
    isCurated: true,
    active: true,
    ...searchClause,
  };
  const mineWhere: Prisma.CollectionWhereInput = {
    isCurated: false,
    ownerId: session.user.id,
    ...searchClause,
  };

  const activeWhere = params.tab === "mine" ? mineWhere : curatedWhere;

  const [curatedCount, mineCount, tabTotal] = await Promise.all([
    prisma.collection.count({ where: curatedWhere }),
    prisma.collection.count({ where: mineWhere }),
    prisma.collection.count({ where: activeWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(tabTotal / PAGE_SIZE));
  const currentPage = Math.min(params.page, totalPages);

  const rows = await prisma.collection.findMany({
    where: activeWhere,
    orderBy:
      params.tab === "mine" ?
        [{ updatedAt: "desc" }]
      : [{ sortOrder: "asc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      curator: { select: { name: true, handle: true } },
      owner: { select: { name: true, handle: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="grid w-full gap-6">
      <PageHeader
        title="Collections"
        description="Browse curated gallery sets and organize wallpapers into your personal boards."
        actions={
          <Link
            href={"/browse" as Route}
            className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CompassIcon data-icon="inline-start" />
            Browse gallery
          </Link>
        }
      />

      <CollectionsDirectoryClient
        tab={params.tab}
        q={params.q}
        page={currentPage}
        totalPages={totalPages}
        curatedCount={curatedCount}
        mineCount={mineCount}
        collections={rows.map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          description: row.description,
          coverUrl: row.coverUrl,
          isCurated: row.isCurated,
          isPublicToMembers: row.isPublicToMembers,
          itemCount: row._count.items,
          updatedAt: row.updatedAt.toISOString(),
          authorName: row.isCurated ? (row.curator?.name ?? null) : (row.owner?.name ?? null),
          authorHandle: row.isCurated ? (row.curator?.handle ?? null) : (row.owner?.handle ?? null),
        }))}
      />
    </div>
  );
};

export default CollectionsPage;
