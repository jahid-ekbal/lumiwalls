import BrowseEmpty from "@/components/Browse/BrowseEmpty";
import BrowseFilters from "@/components/Browse/BrowseFilters";
import BrowseGrid from "@/components/Browse/BrowseGrid";
import BrowseHero from "@/components/Browse/BrowseHero";
import BrowsePagination from "@/components/Browse/BrowsePagination";
import CuratedCollectionsShelf from "@/components/Browse/CuratedCollectionsShelf";
import { GallerySyncProvider } from "@/components/Browse/GallerySyncContext";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import type {
  BrowseCategoryOption,
  BrowseTagOption,
  BrowseWallpaper,
} from "@/components/Browse/browse-types";
import PageHeader from "@/components/UI/PageHeader";
import { buttonVariants } from "@/components/shadcnui/button";
import { requireActiveUser } from "@/lib/auth/session";
import {
  COLOR_BUCKETS,
  bucketHexes,
  hexesForBuckets,
} from "@/lib/colorBuckets";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { browseSearchParamsSchema } from "@/lib/zodSchema";
import { Prisma } from "@generated/prisma/client";
import { FolderHeartIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Browse",
  description: "Browse and discover wallpapers on Lumiwalls",
});

const PAGE_SIZE = 24;

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
      handle: true,
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
  _count: {
    select: {
      favorites: true,
    },
  },
} as const;

type WallpaperWithMeta = Prisma.WallpaperGetPayload<{
  include: typeof wallpaperInclude;
}>;

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const arrayParam = (
  value: string | string[] | undefined,
): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
};

type BrowseSearchParams = {
  [key: string]: string | string[] | undefined;
};

type BrowsePageProps = {
  searchParams: Promise<BrowseSearchParams>;
};

const BrowsePage = async ({ searchParams }: BrowsePageProps) => {
  const session = await requireActiveUser();
  const raw = await searchParams;
  const parsed = browseSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    tags: arrayParam(raw.tags),
    orientation: firstParam(raw.orientation),
    featured: firstParam(raw.featured),
    feed: firstParam(raw.feed),
    colors: arrayParam(raw.colors),
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
  const orientation = params.orientation;
  const tagSlugs = params.tags;
  const colorIndexes = params.colors;
  const featuredOnly = params.featured === "featured";
  const followingOnly = params.feed === "following";
  const now = new Date();

  const [
    categories,
    groupedCounts,
    tagRows,
    colorRows,
    followingRows,
    userBoards,
  ] = await Promise.all([
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
    prisma.tag.findMany({
      where: {
        wallpapers: {
          some: {
            wallpaper: {
              isApproved: true,
              isPublic: true,
            },
          },
        },
      },
      orderBy: {
        wallpapers: {
          _count: "desc",
        },
      },
      take: 40,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            wallpapers: {
              where: {
                wallpaper: {
                  isApproved: true,
                  isPublic: true,
                },
              },
            },
          },
        },
      },
    }),
    prisma.$queryRaw<{ color: string | null }[]>(
      Prisma.sql`SELECT DISTINCT unnest("dominantColors") AS color FROM "wallpaper" WHERE "isApproved" = true AND "isPublic" = true AND "dominantColors" IS NOT NULL AND array_length("dominantColors", 1) > 0`,
    ),
    followingOnly ?
      prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })
    : Promise.resolve([] as { followingId: string }[]),
    prisma.collection.findMany({
      where: { ownerId: session.user.id, isCurated: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublicToMembers: true,
        _count: { select: { items: true } },
        items: { select: { wallpaperId: true } },
      },
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

  const tagOptions: BrowseTagOption[] = tagRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    count: row._count.wallpapers,
  }));

  const knownSlugs = new Set(categories.map((item) => item.slug));
  const categorySlug =
    params.category === "all" || !knownSlugs.has(params.category) ?
      "all"
    : params.category;

  const availableHexes = colorRows
    .map((row) => row.color)
    .filter((hex): hex is string => hex !== null);
  const availableBuckets = bucketHexes(availableHexes);
  const unavailableBuckets = COLOR_BUCKETS.map((bucket) => bucket.index).filter(
    (index) => !availableBuckets.has(index),
  );

  const orientationCondition =
    orientation === "landscape" ? `"width" > "height"`
    : orientation === "portrait" ? `"height" > "width"`
    : `"width" = "height"`;

  const hasFilters =
    query !== "" ||
    categorySlug !== "all" ||
    tagSlugs.length > 0 ||
    orientation !== "any" ||
    featuredOnly ||
    followingOnly ||
    colorIndexes.length > 0;

  const [scheduledHeroRows, curatedCollections, orientationIdRows] =
    await Promise.all([
      hasFilters ?
        Promise.resolve([] as WallpaperWithMeta[])
      : prisma.featuredPlacement
          .findMany({
            where: {
              active: true,
              startAt: { lte: now },
              OR: [{ endAt: null }, { endAt: { gte: now } }],
              wallpaper: { isApproved: true, isPublic: true },
            },
            orderBy: [
              { priority: "asc" },
              { createdAt: "desc" },
            ],
            take: 10,
            include: {
              wallpaper: { include: wallpaperInclude },
            },
          })
          .then((placements) => {
            const seen = new Set<string>();
            const unique: WallpaperWithMeta[] = [];
            for (const placement of placements) {
              if (!seen.has(placement.wallpaper.id)) {
                seen.add(placement.wallpaper.id);
                unique.push(placement.wallpaper);
              }
              if (unique.length >= 5) break;
            }
            return unique;
          }),
      hasFilters ?
        Promise.resolve([])
      : prisma.collection.findMany({
          where: { isCurated: true, active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 4,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverUrl: true,
            _count: { select: { items: true } },
          },
        }),
      orientation === "any" ?
        Promise.resolve([] as { id: string }[])
      : prisma.$queryRaw<{ id: string }[]>(
          Prisma.sql`SELECT "id" FROM "wallpaper" WHERE "isApproved" = true AND "isPublic" = true AND ${Prisma.raw(orientationCondition)} LIMIT 5000`,
        ),
    ]);

  const fallbackHeroRows =
    !hasFilters && scheduledHeroRows.length === 0 ?
      await prisma.wallpaper.findMany({
        where: {
          isApproved: true,
          isPublic: true,
          OR: [{ featured: true }, { editorsPick: true }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: wallpaperInclude,
      })
    : [];

  const heroRows =
    scheduledHeroRows.length > 0 ? scheduledHeroRows : fallbackHeroRows;
  const orientationIds = orientationIdRows.map((row) => row.id);
  const heroIds = heroRows.map((row) => row.id);

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
        { uploader: { name: { contains: query, mode: "insensitive" } } },
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
  if (tagSlugs.length > 0) {
    clauses.push({
      tags: { some: { tag: { slug: { in: tagSlugs } } } },
    });
  }
  if (orientation !== "any") {
    clauses.push({ id: { in: orientationIds } });
  }
  if (featuredOnly) {
    clauses.push({
      OR: [
        { featured: true },
        { editorsPick: true },
        {
          placements: {
            some: {
              active: true,
              startAt: { lte: now },
              OR: [{ endAt: null }, { endAt: { gte: now } }],
            },
          },
        },
      ],
    });
  }
  if (followingOnly) {
    clauses.push({
      uploaderId: { in: followingRows.map((row) => row.followingId) },
    });
  }
  if (colorIndexes.length > 0) {
    const colorHexes = hexesForBuckets(availableBuckets, colorIndexes);
    clauses.push(
      colorHexes.length > 0 ?
        { dominantColors: { hasSome: colorHexes } }
      : { id: { in: [] } },
    );
  }
  if (!hasFilters && heroIds.length > 0) {
    clauses.push({ id: { notIn: heroIds } });
  }
  const where: Prisma.WallpaperWhereInput =
    clauses.length === 1 ? clauses[0] : { AND: clauses };

  const orderBy: Prisma.WallpaperOrderByWithRelationInput[] =
    sort === "oldest" ? [{ createdAt: "asc" }]
    : sort === "views" ? [{ viewCount: "desc" }, { createdAt: "desc" }]
    : sort === "downloads" ? [{ downloadCount: "desc" }, { createdAt: "desc" }]
    : [{ createdAt: "desc" }];

  const [total, previewWallpaper] = await Promise.all([
    prisma.wallpaper.count({ where }),
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const wallpapers = await prisma.wallpaper.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: wallpaperInclude,
  });

  const pageIds = [
    ...wallpapers.map((item) => item.id),
    ...heroIds,
    ...((
      previewWallpaper &&
      !wallpapers.some((item) => item.id === previewWallpaper.id)
    ) ?
      [previewWallpaper.id]
    : []),
  ];

  const [favoritedRows, reportedRows] = await Promise.all([
    pageIds.length > 0 ?
      prisma.favorite.findMany({
        where: {
          userId: session.user.id,
          wallpaperId: { in: pageIds },
        },
        select: { wallpaperId: true },
      })
    : Promise.resolve([] as { wallpaperId: string }[]),
    pageIds.length > 0 ?
      prisma.report.findMany({
        where: {
          reporterId: session.user.id,
          wallpaperId: { in: pageIds },
          status: "PENDING",
        },
        select: { wallpaperId: true },
      })
    : Promise.resolve([] as { wallpaperId: string }[]),
  ]);

  const favoritedSet = new Set(favoritedRows.map((row) => row.wallpaperId));
  const reportedIds = reportedRows.map((row) => row.wallpaperId);

  const boardMembershipByWallpaper = new Map<string, string[]>();
  for (const board of userBoards) {
    for (const item of board.items) {
      const list = boardMembershipByWallpaper.get(item.wallpaperId) ?? [];
      list.push(board.id);
      boardMembershipByWallpaper.set(item.wallpaperId, list);
    }
  }

  const mapRow = (row: WallpaperWithMeta): BrowseWallpaper => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumb400Url: row.thumb400Url,
    thumb800Url: row.thumb800Url,
    thumb1920Url: row.thumb1920Url,
    originalUrl: row.originalUrl,
    blurDataUrl: row.blurDataUrl,
    width: row.width,
    height: row.height,
    format: row.format,
    fileSize: row.fileSize,
    aspectRatio: row.aspectRatio,
    dominantColors: row.dominantColors,
    featured: row.featured,
    editorsPick: row.editorsPick,
    downloadCount: row.downloadCount,
    viewCount: row.viewCount,
    favoriteCount: row._count.favorites,
    favoritedByMe: favoritedSet.has(row.id),
    boardIds: boardMembershipByWallpaper.get(row.id) ?? [],
    createdAt: row.createdAt,
    category: row.category,
    uploader: row.uploader,
    tags: row.tags,
  });

  const gridItems = wallpapers.map(mapRow);
  const heroItems = heroRows.map(mapRow);
  const previewItem = previewWallpaper ? mapRow(previewWallpaper) : null;

  const initialSyncedWallpapers = [
    ...heroItems,
    ...gridItems,
    ...(previewItem ? [previewItem] : []),
  ];

  const boardSummaries = userBoards.map((board) => ({
    id: board.id,
    title: board.title,
    slug: board.slug,
    isPublicToMembers: board.isPublicToMembers,
    itemCount: board._count.items,
  }));

  return (
    <div className="grid w-full gap-6">
      <PageHeader
        title="Browse"
        description="Explore approved high-DPI wallpapers by aspect ratio, palette, category, creator, and curated sets."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={"/collections" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <FolderHeartIcon data-icon="inline-start" />
              Collections
            </Link>
            <Link
              href={"/upload/new" as Route}
              className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <UploadIcon data-icon="inline-start" />
              Submit wallpaper
            </Link>
          </div>
        }
      />

      <BrowseFilters
        categories={categoryOptions}
        tagOptions={tagOptions}
        total={total}
        unavailableBuckets={unavailableBuckets}
      />

      <GallerySyncProvider
        initialWallpapers={initialSyncedWallpapers}
        initialBoards={boardSummaries}>
        {heroItems.length > 0 ?
          <BrowseHero wallpapers={heroItems} />
        : null}

        {curatedCollections.length > 0 ?
          <CuratedCollectionsShelf
            collections={curatedCollections.map((c) => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              description: c.description,
              coverUrl: c.coverUrl,
              itemCount: c._count.items,
            }))}
          />
        : null}

        <section
          id="browse-results"
          className="grid scroll-mt-20 gap-4">
          {gridItems.length === 0 ?
            <BrowseEmpty filtered={hasFilters} />
          : <>
              <BrowseGrid
                wallpapers={gridItems}
                reportedIds={reportedIds}
              />
              <BrowsePagination
                page={currentPage}
                totalPages={totalPages}
              />
            </>
          }
        </section>

        <WallpaperPreview
          wallpapers={[...heroItems, ...gridItems]}
          previewWallpaper={previewItem}
          reportedIds={reportedIds}
        />
      </GallerySyncProvider>
    </div>
  );
};

export default BrowsePage;
