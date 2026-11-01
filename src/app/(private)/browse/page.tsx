import BrowseEmpty from "@/components/Browse/BrowseEmpty";
import BrowseFilters from "@/components/Browse/BrowseFilters";
import BrowseGrid from "@/components/Browse/BrowseGrid";
import BrowseHero from "@/components/Browse/BrowseHero";
import BrowsePagination from "@/components/Browse/BrowsePagination";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import type {
  BrowseCategoryOption,
  BrowseTagOption,
  BrowseWallpaper,
} from "@/components/Browse/browse-types";
import { auth } from "@/lib/auth";
import {
  bucketHexes,
  COLOR_BUCKETS,
  hexesForBuckets,
} from "@/lib/colorBuckets";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { browseSearchParamsSchema } from "@/lib/zodSchema";
import { Prisma } from "@generated/prisma/client";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Browse",
  description: "Browse and discover wallpapers on Lumiwalls",
});

const PAGE_SIZE = 8;

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
  const raw = await searchParams;
  const parsed = browseSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    tags: arrayParam(raw.tags),
    orientation: firstParam(raw.orientation),
    featured: firstParam(raw.featured),
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

  const [categories, groupedCounts, tagRows, colorRows, session] =
    await Promise.all([
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
      auth.api.getSession({ headers: await headers() }),
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
    colorIndexes.length > 0;

  const [heroRows, orientationIdRows] = await Promise.all([
    hasFilters ?
      Promise.resolve([] as WallpaperWithMeta[])
    : prisma.wallpaper.findMany({
        where: {
          isApproved: true,
          isPublic: true,
          OR: [{ featured: true }, { editorsPick: true }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: wallpaperInclude,
      }),
    orientation === "any" ?
      Promise.resolve([] as { id: string }[])
    : prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT "id" FROM "wallpaper" WHERE "isApproved" = true AND "isPublic" = true AND ${Prisma.raw(orientationCondition)} LIMIT 5000`,
      ),
  ]);
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
  if (orientationIds.length > 0) {
    clauses.push({ id: { in: orientationIds } });
  }
  if (featuredOnly) {
    clauses.push({ OR: [{ featured: true }, { editorsPick: true }] });
  }
  const colorHexes = hexesForBuckets(availableBuckets, colorIndexes);
  if (colorHexes.length > 0) {
    clauses.push({ dominantColors: { hasSome: colorHexes } });
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

  const [wallpapers, total, previewWallpaper] = await Promise.all([
    prisma.wallpaper.findMany({
      where,
      orderBy,
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: wallpaperInclude,
    }),
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
    session?.user && pageIds.length > 0 ?
      prisma.favorite.findMany({
        where: {
          userId: session.user.id,
          wallpaperId: { in: pageIds },
        },
        select: { wallpaperId: true },
      })
    : Promise.resolve([] as { wallpaperId: string }[]),
    session?.user && pageIds.length > 0 ?
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
    createdAt: row.createdAt,
    category: row.category,
    uploader: row.uploader,
    tags: row.tags,
  });

  const gridItems = wallpapers.map(mapRow);
  const heroItems = heroRows.map(mapRow);
  const previewItem = previewWallpaper ? mapRow(previewWallpaper) : null;

  return (
    <div className="wash-cinematic w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="grid gap-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Browse
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Search and discover approved wallpapers. Filter by category, tags,
            orientation, or dominant color, and open a card for the full
            preview.
          </p>
        </header>
        <BrowseFilters
          categories={categoryOptions}
          tagOptions={tagOptions}
          total={total}
          unavailableBuckets={unavailableBuckets}
        />
        {heroItems.length > 0 ?
          <BrowseHero wallpapers={heroItems} />
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
                page={requestedPage}
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
      </div>
    </div>
  );
};

export default BrowsePage;
