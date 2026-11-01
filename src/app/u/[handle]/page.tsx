import { initialsOf } from "@/components/Browse/countFormat";
import BrowseGrid from "@/components/Browse/BrowseGrid";
import type { BrowseWallpaper } from "@/components/Browse/browse-types";
import WallpaperPreview from "@/components/Browse/WallpaperPreview";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { buttonVariants } from "@/components/shadcnui/button";
import { Card, CardContent, CardTitle } from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { toImagePath } from "@/lib/imageUrl";
import { createMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import type { Prisma } from "@generated/prisma/client";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ImagesIcon,
  MapPinIcon,
  ShieldOffIcon,
  UploadIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import FollowButton from "./_components/follow-button";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Public profile",
  description: "A creator profile on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type PublicProfilePageProps = {
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

type BanStatusUser = {
  banned: boolean | null;
  banExpires: Date | null;
};

// A temp ban lapses at banExpires; a permanent ban (no expiry) stays active.
const isBanActive = (user: BanStatusUser): boolean => {
  if (user.banned !== true) {
    return false;
  }
  if (!user.banExpires) {
    return true;
  }
  return user.banExpires.getTime() > Date.now();
};

const PublicProfilePage = async ({
  params,
  searchParams,
}: PublicProfilePageProps) => {
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

  const isBanned = isBanActive(profile);

  if (isBanned) {
    return (
      <div className="wash-cinematic grid min-h-svh w-full place-items-center p-4">
        <Card className="max-w-sm">
          <CardContent className="grid justify-items-center gap-3 text-center">
            <ShieldOffIcon className="text-muted-foreground size-8" />
            <CardTitle>This profile is not available</CardTitle>
            <p className="text-muted-foreground text-sm">
              This account is currently suspended and its content is
              unavailable.
            </p>
            <Link
              href={"/" as Route}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}>
              <ArrowLeftIcon
                data-icon="inline-start"
                className="size-4"
              />
              <span>Back to Lumiwalls</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user.id ?? null;
  const isOwner = viewerId !== null && viewerId === profile.id;

  const rawSearch = await searchParams;
  const previewSlug = firstParam(rawSearch.preview) ?? "";
  const profileHandle = profile.handle ?? "";

  const [wallpapers, previewWallpaper, followRow] = await Promise.all([
    prisma.wallpaper.findMany({
      where: {
        uploaderId: profile.id,
        isApproved: true,
        isPublic: true,
      },
      orderBy: [{ createdAt: "desc" }],
      include: wallpaperInclude,
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
    viewerId ?
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: profile.id,
          },
        },
        select: { followerId: true },
      })
    : Promise.resolve(null),
  ]);

  const pageIds = [
    ...wallpapers.map((item) => item.id),
    ...(previewWallpaper ? [previewWallpaper.id] : []),
  ];
  const favoritedRows =
    viewerId && pageIds.length > 0 ?
      await prisma.favorite.findMany({
        where: {
          userId: viewerId,
          wallpaperId: { in: pageIds },
        },
        select: { wallpaperId: true },
      })
    : [];
  const favoritedSet = new Set(favoritedRows.map((row) => row.wallpaperId));

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
  const previewItem = previewWallpaper ? mapRow(previewWallpaper) : null;

  const counts = profile._count;
  const bannerSrc = toImagePath(profile.bannerUrl);
  const avatarSrc = toImagePath(profile.image);

  return (
    <div className="wash-cinematic min-h-svh w-full">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <div>
          <Link
            href={(session ? "/browse" : "/") as Route}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-fit",
            )}>
            <ArrowLeftIcon
              data-icon="inline-start"
              className="size-4"
            />
            <span>{session ? "Back to browse" : "Back to Lumiwalls"}</span>
          </Link>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <div className="relative h-44 overflow-hidden sm:h-56">
            {bannerSrc ?
              <Image
                src={bannerSrc}
                alt="Profile banner"
                fill={true}
                priority={true}
                sizes="(max-width: 1100px) 100vw, 1024px"
                className="object-cover"
              />
            : <div className="from-primary/25 via-primary/5 bg-gradient-to-tr to-transparent" />
            }
          </div>

          <div className="-mt-10 grid gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
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
              {!isOwner && viewerId ?
                <FollowButton
                  handle={profileHandle}
                  following={Boolean(followRow)}
                />
              : null}
            </div>

            <div className="grid gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {profile.name}
              </h1>
              <p className="text-muted-foreground text-sm">@{profileHandle}</p>
              {profile.bio ?
                <p className="text-sm whitespace-pre-line">{profile.bio}</p>
              : null}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                <span className="text-foreground font-semibold tabular-nums">
                  {counts.wallpapers}
                </span>{" "}
                wallpapers
              </span>
              <span>
                <span className="text-foreground font-semibold tabular-nums">
                  {counts.followers}
                </span>{" "}
                followers
              </span>
              <span>
                <span className="text-foreground font-semibold tabular-nums">
                  {counts.following}
                </span>{" "}
                following
              </span>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {profile.location ?
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="size-4" />
                  {profile.location}
                </span>
              : null}
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-4" />
                Member since {format(profile.createdAt, "MMMM yyyy")}
              </span>
            </div>
          </div>
        </Card>

        <section className="grid gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Wallpapers
          </h2>
          {gridItems.length === 0 ?
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <ImagesIcon className="text-muted-foreground size-8" />
                <p className="text-muted-foreground max-w-sm text-sm">
                  {isOwner ?
                    "You have not posted any wallpapers yet. Share one with the community."
                  : "No wallpapers yet. Check back later."}
                </p>
                {isOwner ?
                  <Link
                    href={"/upload" as Route}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}>
                    <UploadIcon
                      data-icon="inline-start"
                      className="size-4"
                    />
                    <span>Upload a wallpaper</span>
                  </Link>
                : null}
              </CardContent>
            </Card>
          : <BrowseGrid
              wallpapers={gridItems}
              showReport={false}
            />
          }
        </section>

        <WallpaperPreview
          wallpapers={gridItems}
          previewWallpaper={previewItem}
          reportedIds={[]}
        />
      </div>
    </div>
  );
};

export default PublicProfilePage;
