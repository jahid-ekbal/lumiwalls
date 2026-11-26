import BrowseGrid from "@/components/Browse/BrowseGrid";
import { GallerySyncProvider } from "@/components/Browse/GallerySyncContext";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import type { BrowseWallpaper } from "@/components/Browse/browse-types";
import FollowListButtons from "@/components/Profile/FollowListDialog";
import EmptyState from "@/components/UI/EmptyState";
import Pagination from "@/components/UI/Pagination";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import { Card, CardContent, CardTitle } from "@/components/shadcnui/card";
import { isBanActive, requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import {
  formatCompactCount,
  formatCount,
  formatDate,
  formatPluralCount,
  initialsOf,
} from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { createMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import type { Prisma } from "@generated/prisma/client";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  FolderHeartIcon,
  ImagesIcon,
  MapPinIcon,
  ShieldOffIcon,
  UploadIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FollowButton from "./_components/follow-button";
import ShareProfileButton from "./_components/share-profile-button";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Creator profile",
  description: "A creator profile on Lumiwalls",
});

const PAGE_SIZE = 24;

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type CreatorProfilePageProps = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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

const CreatorProfilePage = async ({
  params,
  searchParams,
}: CreatorProfilePageProps) => {
  const session = await requireActiveUser();

  const { handle: rawHandle } = await params;
  let handle = "";
  try {
    handle = decodeURIComponent(rawHandle).toLowerCase();
  } catch {
    notFound();
  }

  const profile = await prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      bio: true,
      location: true,
      image: true,
      bannerUrl: true,
      createdAt: true,
      banned: true,
      banExpires: true,
      followers: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          follower: {
            select: { id: true, name: true, handle: true, image: true },
          },
        },
      },
      following: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          following: {
            select: { id: true, name: true, handle: true, image: true },
          },
        },
      },
      _count: {
        select: {
          wallpapers: { where: { isApproved: true, isPublic: true } },
          followers: true,
          following: true,
        },
      },
    },
  });
  if (!profile) {
    notFound();
  }

  if (isBanActive(profile)) {
    return (
      <div className="grid w-full place-items-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="grid justify-items-center gap-3 text-center">
            <ShieldOffIcon className="text-muted-foreground size-8" />
            <CardTitle>This profile is not available</CardTitle>
            <p className="text-muted-foreground text-sm">
              This account is currently suspended and its content is
              unavailable.
            </p>
            <Link
              href={"/browse" as Route}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}>
              <ArrowLeftIcon
                data-icon="inline-start"
                className="size-4"
              />
              <span>Back to browse</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viewerId = session.user.id;
  const isOwner = viewerId === profile.id;

  const rawSearch = await searchParams;
  const previewSlug = firstParam(rawSearch.preview) ?? "";
  const requestedPage = Math.max(
    1,
    Number.parseInt(firstParam(rawSearch.page) ?? "1", 10) || 1,
  );
  const profileHandle = profile.handle ?? "";

  const whereWallpapers: Prisma.WallpaperWhereInput = {
    uploaderId: profile.id,
    isApproved: true,
    isPublic: true,
  };

  const totalCount = await prisma.wallpaper.count({ where: whereWallpapers });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const [
    wallpapers,
    viewsAgg,
    previewWallpaper,
    followRow,
    creatorBoards,
    viewerBoards,
  ] = await Promise.all([
    prisma.wallpaper.findMany({
      where: whereWallpapers,
      orderBy: [{ createdAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: wallpaperInclude,
    }),
    prisma.wallpaper.aggregate({
      where: whereWallpapers,
      _sum: { viewCount: true },
    }),
    previewSlug ?
      prisma.wallpaper.findFirst({
        where: {
          slug: previewSlug,
          uploaderId: profile.id,
          isApproved: true,
          isPublic: true,
        },
        include: wallpaperInclude,
      })
    : Promise.resolve(null),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: profile.id,
        },
      },
      select: { followerId: true },
    }),
    prisma.collection.findMany({
      where: {
        ownerId: profile.id,
        isCurated: false,
        ...(isOwner ? {} : { isPublicToMembers: true }),
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.collection.findMany({
      where: { ownerId: viewerId, isCurated: false },
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

  const pageIds = [
    ...wallpapers.map((item) => item.id),
    ...(previewWallpaper ? [previewWallpaper.id] : []),
  ];
  const favoritedRows =
    pageIds.length > 0 ?
      await prisma.favorite.findMany({
        where: {
          userId: viewerId,
          wallpaperId: { in: pageIds },
        },
        select: { wallpaperId: true },
      })
    : [];
  const favoritedSet = new Set(favoritedRows.map((row) => row.wallpaperId));

  const boardMembership = new Map<string, string[]>();
  for (const board of viewerBoards) {
    for (const item of board.items) {
      const list = boardMembership.get(item.wallpaperId) ?? [];
      list.push(board.id);
      boardMembership.set(item.wallpaperId, list);
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
    boardIds: boardMembership.get(row.id) ?? [],
    createdAt: row.createdAt,
    category: row.category,
    uploader: row.uploader,
    tags: row.tags,
  });

  const gridItems = wallpapers.map(mapRow);
  const previewItem = previewWallpaper ? mapRow(previewWallpaper) : null;

  const counts = profile._count;
  const totalViews = viewsAgg._sum.viewCount ?? 0;
  const bannerSrc = toImagePath(profile.bannerUrl);
  const avatarSrc = toImagePath(profile.image);

  return (
    <div className="grid w-full gap-6">
      <div>
        <Link
          href={"/browse" as Route}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit",
          )}>
          <ArrowLeftIcon data-icon="inline-start" />
          <span>Back to browse</span>
        </Link>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="bg-muted/40 relative h-44 overflow-hidden sm:h-56">
          {bannerSrc ?
            <Image
              src={bannerSrc}
              alt="Profile banner"
              fill={true}
              priority={true}
              sizes="100vw"
              className="object-cover"
            />
          : <div
              aria-hidden="true"
              className="from-muted via-muted/70 to-card relative size-full overflow-hidden bg-gradient-to-br">
              <div className="bg-foreground/5 absolute -top-24 -left-16 size-72 rounded-full blur-3xl" />
              <div className="bg-foreground/5 absolute -right-12 -bottom-20 size-64 rounded-full blur-3xl" />
              <div className="via-border absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            </div>
          }
        </div>

        <div className="-mt-10 grid gap-4 px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Avatar className="ring-card size-20 ring-4">
              {avatarSrc ?
                <AvatarImage
                  src={avatarSrc}
                  alt={profile.name}
                />
              : null}
              <AvatarFallback className="text-2xl">
                {initialsOf(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2">
              <ShareProfileButton handle={profileHandle} />
              {!isOwner ?
                <FollowButton
                  handle={profileHandle}
                  following={Boolean(followRow)}
                />
              : null}
            </div>
          </div>

          <div className="grid gap-1">
            <h1 className="font-heading text-h1 font-semibold tracking-tight">
              {profile.name}
            </h1>
            <p className="text-body-sm text-muted-foreground">
              @{profileHandle}
            </p>
            {profile.bio ?
              <p className="text-body-sm pt-1 whitespace-pre-line">
                {profile.bio}
              </p>
            : null}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
            <span>
              <span className="text-foreground font-semibold tabular-nums">
                {formatCount(counts.wallpapers)}
              </span>{" "}
              wallpapers
            </span>
            <span>
              <span className="text-foreground font-semibold tabular-nums">
                {formatCompactCount(totalViews)}
              </span>{" "}
              views
            </span>
            <FollowListButtons
              followersCount={counts.followers}
              followingCount={counts.following}
              followers={profile.followers.map((row) => row.follower)}
              following={profile.following.map((row) => row.following)}
            />
          </div>

          <div className="text-caption text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1">
            {profile.location ?
              <span className="flex items-center gap-1.5">
                <MapPinIcon
                  aria-hidden="true"
                  className="size-3.5"
                />
                {profile.location}
              </span>
            : null}
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon
                aria-hidden="true"
                className="size-3.5"
              />
              Member since {formatDate(profile.createdAt, "MMMM yyyy")}
            </span>
          </div>
        </div>
      </Card>

      {creatorBoards.length > 0 ?
        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-h2 font-semibold tracking-tight">
              Boards
            </h2>
            <Badge variant="outline">{creatorBoards.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {creatorBoards.map((board) => {
              const coverSrc = toImagePath(board.coverUrl);
              return (
                <Link
                  key={board.id}
                  href={`/collections/${board.slug}` as Route}
                  className="border-border/70 bg-card hover:border-foreground/30 flex h-full flex-col overflow-hidden rounded-inset border transition-colors">
                  <div className="bg-muted/40 relative h-28 w-full overflow-hidden">
                    {coverSrc ?
                      <Image
                        src={coverSrc}
                        alt={board.title}
                        fill={true}
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                      />
                    : <div className="flex size-full items-center justify-center">
                        <FolderHeartIcon className="text-muted-foreground size-6" />
                      </div>
                    }
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="truncate text-sm font-medium">
                      {board.title}
                    </span>
                    <span className="text-caption text-muted-foreground shrink-0">
                      {formatPluralCount(board._count.items, "pin", "pins")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      : null}

      <GallerySyncProvider
        initialWallpapers={[
          ...gridItems,
          ...(previewItem ? [previewItem] : []),
        ]}
        initialBoards={viewerBoards.map((board) => ({
          id: board.id,
          title: board.title,
          slug: board.slug,
          isPublicToMembers: board.isPublicToMembers,
          itemCount: board._count.items,
        }))}>
        <section className="grid gap-4">
          <h2 className="font-heading text-h2 font-semibold tracking-tight">
            Wallpapers
          </h2>
          {gridItems.length === 0 ?
            <EmptyState
              icon={ImagesIcon}
              title={
                isOwner ? "No public wallpapers yet" : "Nothing published yet"
              }
              description={
                isOwner ?
                  "You have not published any approved wallpapers yet. Share one with the community."
                : "This creator has not published any wallpapers yet. Check back soon."
              }
              action={
                isOwner ?
                  <Link
                    href={"/upload/new" as Route}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}>
                    <UploadIcon data-icon="inline-start" />
                    Upload a wallpaper
                  </Link>
                : undefined
              }
            />
          : <>
              <BrowseGrid
                wallpapers={gridItems}
                showReport={false}
              />
              {totalPages > 1 ?
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  createHref={(targetPage) =>
                    `/u/${encodeURIComponent(profileHandle)}?page=${targetPage}` as Route
                  }
                />
              : null}
            </>
          }
        </section>

        <WallpaperPreview
          wallpapers={gridItems}
          previewWallpaper={previewItem}
          reportedIds={[]}
        />
      </GallerySyncProvider>
    </div>
  );
};

export default CreatorProfilePage;
