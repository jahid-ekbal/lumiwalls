import BrowseGrid from "@/components/Browse/BrowseGrid";
import { GallerySyncProvider } from "@/components/Browse/GallerySyncContext";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import type { BrowseWallpaper } from "@/components/Browse/browse-types";
import BoardDetailActions from "@/components/Collections/BoardDetailActions";
import EmptyState from "@/components/UI/EmptyState";
import PageHeader from "@/components/UI/PageHeader";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import { requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { formatPluralCount } from "@/lib/format";
import { createMetadata } from "@/lib/metadata";
import {
  CompassIcon,
  FolderHeartIcon,
  GlobeIcon,
  LockIcon,
  SparklesIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Collection",
  description: "Explore a curated collection or board on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const CollectionDetailPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await requireActiveUser();
  const { slug } = await params;
  const raw = await searchParams;
  const previewSlug = (firstParam(raw.preview) ?? "").trim();

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      curator: { select: { id: true, name: true, handle: true } },
      owner: { select: { id: true, name: true, handle: true } },
      items: {
        where: { wallpaper: { isApproved: true, isPublic: true } },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        include: {
          wallpaper: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              uploader: { select: { name: true, handle: true, image: true } },
              tags: {
                take: 5,
                include: { tag: { select: { id: true, name: true, slug: true } } },
              },
              _count: { select: { favorites: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = !collection.isCurated && collection.ownerId === session.user.id;
  if (collection.isCurated) {
    if (!collection.active && !isAdmin) notFound();
  } else if (!collection.isPublicToMembers && !isOwner && !isAdmin) {
    notFound();
  }

  const wallpaperIds = collection.items.map((item) => item.wallpaper.id);
  const [favoritedRows, reportedRows, userBoards] = await Promise.all([
    wallpaperIds.length > 0 ?
      prisma.favorite.findMany({
        where: {
          userId: session.user.id,
          wallpaperId: { in: wallpaperIds },
        },
        select: { wallpaperId: true },
      })
    : Promise.resolve([] as { wallpaperId: string }[]),
    wallpaperIds.length > 0 ?
      prisma.report.findMany({
        where: {
          reporterId: session.user.id,
          wallpaperId: { in: wallpaperIds },
          status: "PENDING",
        },
        select: { wallpaperId: true },
      })
    : Promise.resolve([] as { wallpaperId: string }[]),
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

  const gridItems: BrowseWallpaper[] = collection.items.map(({ wallpaper: row }) => ({
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
  }));

  const previewItem =
    previewSlug ?
      (gridItems.find((item) => item.slug === previewSlug) ?? null)
    : null;

  const author = collection.isCurated ? collection.curator : collection.owner;

  return (
    <div className="grid w-full gap-6">
      <PageHeader
        title={collection.title}
        description={
          collection.description ??
          `${formatPluralCount(gridItems.length, "wallpaper", "wallpapers")} collected here.`
        }
        backHref={
          (collection.isCurated ? "/collections" : "/collections?tab=mine") as Route
        }
        backLabel="All collections"
        actions={
          <BoardDetailActions
            id={collection.id}
            title={collection.title}
            slug={collection.slug}
            description={collection.description}
            isPublicToMembers={collection.isPublicToMembers}
            canEditBoard={isOwner}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">
          {collection.isCurated ?
            <>
              <SparklesIcon data-icon="inline-start" />
              Curated set
            </>
          : <>
              <FolderHeartIcon data-icon="inline-start" />
              Personal board
            </>
          }
        </Badge>
        {!collection.isCurated ?
          <Badge variant="outline">
            {collection.isPublicToMembers ?
              <>
                <GlobeIcon data-icon="inline-start" />
                Visible to members
              </>
            : <>
                <LockIcon data-icon="inline-start" />
                Private to you
              </>
            }
          </Badge>
        : null}
        <Badge variant="outline">
          {formatPluralCount(gridItems.length, "pin", "pins")}
        </Badge>
        {author ?
          <span className="text-muted-foreground text-xs">
            Curated by{" "}
            {author.handle ?
              <Link
                href={`/u/${author.handle}` as Route}
                className="text-foreground font-medium underline-offset-4 hover:underline">
                {author.name}
              </Link>
            : author.name}
          </span>
        : null}
      </div>

      <GallerySyncProvider
        initialWallpapers={gridItems}
        initialBoards={userBoards.map((board) => ({
          id: board.id,
          title: board.title,
          slug: board.slug,
          isPublicToMembers: board.isPublicToMembers,
          itemCount: board._count.items,
        }))}>
        {gridItems.length === 0 ?
          <EmptyState
            icon={FolderHeartIcon}
            title="This board has no wallpapers yet"
            description="Open any wallpaper in Browse and use Save to pin it here."
            action={
              <Link
                href={"/browse" as Route}
                className={buttonVariants({ variant: "outline", size: "sm" })}>
                <CompassIcon data-icon="inline-start" />
                Explore gallery
              </Link>
            }
          />
        : <BrowseGrid
            wallpapers={gridItems}
            reportedIds={reportedIds}
          />
        }

        <WallpaperPreview
          wallpapers={gridItems}
          previewWallpaper={previewItem}
          reportedIds={reportedIds}
        />
      </GallerySyncProvider>
    </div>
  );
};

export default CollectionDetailPage;
