import FeaturedClient from "@/components/Admin/FeaturedClient";
import prisma from "@/lib/database/dbClient";
import type { FeaturedSearchParamsType } from "@/lib/zodSchema";
import type { Prisma } from "@generated/prisma/client";

const PAGE_SIZE = 12;

type Props = {
  params: FeaturedSearchParamsType;
};

const FeaturedContent = async ({ params }: Props) => {
  const query = params.q.trim();
  const now = new Date();

  const flagClauses: Prisma.WallpaperWhereInput[] = [
    { isApproved: true, isPublic: true },
  ];
  if (params.flag === "featured") {
    flagClauses.push({ featured: true });
  } else if (params.flag === "pick") {
    flagClauses.push({ editorsPick: true });
  } else if (params.flag === "both") {
    flagClauses.push({ featured: true, editorsPick: true });
  } else {
    flagClauses.push({ OR: [{ featured: true }, { editorsPick: true }] });
  }
  if (query !== "") {
    flagClauses.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { uploader: { email: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  const flagWhere: Prisma.WallpaperWhereInput = { AND: flagClauses };

  const placementClauses: Prisma.FeaturedPlacementWhereInput[] = [];
  if (params.placement !== "ALL") {
    placementClauses.push({ placement: params.placement });
  }
  if (params.window === "active") {
    placementClauses.push({
      active: true,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    });
  } else if (params.window === "upcoming") {
    placementClauses.push({ active: true, startAt: { gt: now } });
  } else if (params.window === "expired") {
    placementClauses.push({
      OR: [{ active: false }, { endAt: { lt: now } }],
    });
  }
  if (query !== "") {
    placementClauses.push({
      wallpaper: { title: { contains: query, mode: "insensitive" } },
    });
  }
  const placementWhere: Prisma.FeaturedPlacementWhereInput =
    placementClauses.length === 0 ? {}
    : placementClauses.length === 1 ? placementClauses[0]
    : { AND: placementClauses };

  const placementOrderBy: Prisma.FeaturedPlacementOrderByWithRelationInput[] =
    params.sort === "newest" ?
      [{ createdAt: "desc" }]
    : [{ priority: "desc" }, { startAt: "desc" }];

  const [flagTotal, placementTotal, flagRows, placementRows] =
    await Promise.all([
      prisma.wallpaper.count({ where: flagWhere }),
      prisma.featuredPlacement.count({ where: placementWhere }),
      prisma.wallpaper.findMany({
        where: flagWhere,
        orderBy: { updatedAt: "desc" },
        skip: params.tab === "flags" ? (params.page - 1) * PAGE_SIZE : 0,
        take: params.tab === "flags" ? PAGE_SIZE : 0,
        select: {
          id: true,
          title: true,
          slug: true,
          thumb400Url: true,
          featured: true,
          editorsPick: true,
          uploader: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.featuredPlacement.findMany({
        where: placementWhere,
        orderBy: placementOrderBy,
        skip: params.tab === "placements" ? (params.page - 1) * PAGE_SIZE : 0,
        take: params.tab === "placements" ? PAGE_SIZE : 0,
        include: {
          curator: { select: { id: true, name: true, email: true } },
          wallpaper: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumb400Url: true,
              isPublic: true,
              isApproved: true,
              uploader: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

  const flagTotalPages = Math.max(1, Math.ceil(flagTotal / PAGE_SIZE));
  const placementTotalPages = Math.max(
    1,
    Math.ceil(placementTotal / PAGE_SIZE),
  );

  return (
    <FeaturedClient
      params={params}
      counts={{ flags: flagTotal, placements: placementTotal }}
      flagTotalPages={flagTotalPages}
      placementTotalPages={placementTotalPages}
      flags={flagRows.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumb400Url: item.thumb400Url,
        featured: item.featured,
        editorsPick: item.editorsPick,
        uploader: item.uploader,
      }))}
      placements={placementRows.map((item) => ({
        id: item.id,
        placement: item.placement,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt?.toISOString() ?? null,
        priority: item.priority,
        active: item.active,
        createdAt: item.createdAt.toISOString(),
        curator: item.curator,
        wallpaper: {
          id: item.wallpaper.id,
          title: item.wallpaper.title,
          slug: item.wallpaper.slug,
          thumb400Url: item.wallpaper.thumb400Url,
          isPublic: item.wallpaper.isPublic,
          isApproved: item.wallpaper.isApproved,
          uploader: item.wallpaper.uploader,
        },
      }))}
    />
  );
};

export default FeaturedContent;
