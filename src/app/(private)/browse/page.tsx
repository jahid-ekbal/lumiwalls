import BrowseFilters from "@/components/Browse/BrowseFilters";
import BrowseGrid from "@/components/Browse/BrowseGrid";
import BrowsePagination from "@/components/Browse/BrowsePagination";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import type { BrowseCategoryOption } from "@/components/Browse/browse-types";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { browseSearchParamsSchema } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Browse",
  description: "Browse and discover wallpapers on Lumiwalls",
});

const PAGE_SIZE = 12;

const wallpaperInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  uploader: {
    select: {
      name: true,
      image: true,
    },
  },
  tags: {
    take: 5,
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type BrowseSearchParams = {
  [key: string]: string | string[] | undefined;
};

type BrowsePageProps = {
  searchParams: Promise<BrowseSearchParams>;
};

const BrowsePage = async ({ searchParams }: BrowsePageProps) => {
  const raw = await searchParams;
  const parsed = browseSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
    preview: firstParam(raw.preview),
  });
  const params =
    parsed.success ? parsed.data : browseSearchParamsSchema.parse({});

  const query = params.q.trim();
  const sort = params.sort;
  const requestedPage = params.page;
  const previewSlug = params.preview.trim();

  const [categories, groupedCounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.wallpaper.groupBy({
      by: ["categoryId"],
      where: {
        isApproved: true,
        isPublic: true,
      },
      _count: { _all: true },
    }),
  ]);

  const countByCategory = new Map<string, number>();
  for (const row of groupedCounts) {
    if (row.categoryId) {
      countByCategory.set(row.categoryId, row._count._all);
    }
  }

  const categoryOptions: BrowseCategoryOption[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    count: countByCategory.get(item.id) ?? 0,
  }));

  const knownSlugs = new Set(categories.map((item) => item.slug));
  const categorySlug =
    params.category === "all" || !knownSlugs.has(params.category) ?
      "all"
    : params.category;

  const clauses: Prisma.WallpaperWhereInput[] = [
    {
      isApproved: true,
      isPublic: true,
    },
  ];
  if (query !== "") {
    clauses.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          tags: {
            some: {
              tag: { name: { contains: query, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }
  if (categorySlug !== "all") {
    clauses.push({ category: { slug: categorySlug } });
  }
  const where: Prisma.WallpaperWhereInput =
    clauses.length === 1 ? clauses[0] : { AND: clauses };

  const orderBy: Prisma.WallpaperOrderByWithRelationInput[] =
    sort === "oldest" ? [{ createdAt: "asc" }]
    : sort === "views" ? [{ viewCount: "desc" }, { createdAt: "desc" }]
    : sort === "downloads" ? [{ downloadCount: "desc" }, { createdAt: "desc" }]
    : [{ createdAt: "desc" }];

  const total = await prisma.wallpaper.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  const [wallpapers, previewWallpaper] = await Promise.all([
    prisma.wallpaper.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: wallpaperInclude,
    }),
    previewSlug === "" ?
      Promise.resolve(null)
    : prisma.wallpaper.findFirst({
        where: {
          slug: previewSlug,
          isApproved: true,
          isPublic: true,
        },
        include: wallpaperInclude,
      }),
  ]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid gap-6">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Browse
          </h1>
          <p className="text-muted-foreground text-sm">
            Search and filter approved public wallpapers. Select a card for
            details.
          </p>
        </div>
        <Suspense>
          <BrowseFilters
            categories={categoryOptions}
            total={total}
          />
        </Suspense>
        <div
          id="browse-results"
          className="scroll-mt-20">
          {wallpapers.length === 0 ?
            <p className="text-muted-foreground py-12 text-center text-sm">
              No wallpapers found.
            </p>
          : <Suspense>
              <BrowseGrid wallpapers={wallpapers} />
            </Suspense>
          }
        </div>
        <Suspense>
          <BrowsePagination
            page={page}
            totalPages={totalPages}
          />
        </Suspense>
        <Suspense>
          <WallpaperPreview
            wallpapers={wallpapers}
            previewWallpaper={previewWallpaper}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default BrowsePage;
