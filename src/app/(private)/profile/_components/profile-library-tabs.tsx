"use client";

import EmptyState from "@/components/UI/EmptyState";
import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcnui/tabs";
import { formatDate, formatRelativeDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import {
  ArrowRightIcon,
  CompassIcon,
  DownloadIcon,
  FolderHeartIcon,
  HeartIcon,
  ImagesIcon,
  LockIcon,
  UploadIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

export type ProfileLibraryUpload = {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  isApproved: boolean;
  isPublic: boolean;
  thumb400Url: string | null;
  thumb800Url: string | null;
  originalUrl: string | null;
  blurDataUrl: string | null;
  moderationStatus: string | null;
};

export type ProfileLibraryFavorite = {
  id: string;
  title: string;
  slug: string;
  favoritedAt: string;
  thumb400Url: string | null;
  thumb800Url: string | null;
  originalUrl: string | null;
  blurDataUrl: string | null;
  uploaderName: string;
};

export type ProfileLibraryBoard = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  isPublicToMembers: boolean;
  itemCount: number;
  updatedAt: string;
};

export type ProfileLibraryDownload = {
  id: string;
  wallpaperId: string;
  title: string;
  slug: string;
  variant: string;
  downloadedAt: string;
  thumb400Url: string | null;
  blurDataUrl: string | null;
};

type ProfileLibraryTabsProps = {
  uploads: ProfileLibraryUpload[];
  favorites: ProfileLibraryFavorite[];
  boards: ProfileLibraryBoard[];
  downloads: ProfileLibraryDownload[];
};

const ProfileLibraryTabs = ({
  uploads,
  favorites,
  boards,
  downloads,
}: ProfileLibraryTabsProps) => {
  return (
    <Card>
      <Tabs defaultValue="uploads">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>Library</CardTitle>
              <CardDescription>
                Your recent submissions, saved favorites, personal boards, and
                download history
              </CardDescription>
            </div>
            <CardAction className="flex flex-wrap gap-2">
              <Link
                href={"/collections?tab=mine" as Route}
                className={buttonVariants({ variant: "ghost", size: "sm" })}>
                All boards
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href={"/upload" as Route}
                className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Manage uploads
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </CardAction>
          </div>
          <TabsList>
            <TabsTrigger value="uploads">
              <ImagesIcon data-icon="inline-start" />
              Uploads ({uploads.length})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <HeartIcon data-icon="inline-start" />
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="boards">
              <FolderHeartIcon data-icon="inline-start" />
              Boards ({boards.length})
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <DownloadIcon data-icon="inline-start" />
              Downloads ({downloads.length})
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          <TabsContent value="uploads">
            {uploads.length === 0 ?
              <EmptyState
                compact={true}
                icon={ImagesIcon}
                title="No uploads yet"
                description="You have not submitted any wallpapers yet. Share your first one."
                action={
                  <Link
                    href={"/upload/new" as Route}
                    className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <UploadIcon data-icon="inline-start" />
                    Upload wallpaper
                  </Link>
                }
              />
            : <ul className="grid gap-2 md:grid-cols-2">
                {uploads.map((row) => {
                  const status = deriveWallpaperStatus({
                    isApproved: row.isApproved,
                    moderationStatus: row.moderationStatus,
                  });
                  const src = toImagePath(
                    row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
                  );
                  const href =
                    row.isApproved && row.isPublic ?
                      (`/browse?preview=${row.slug}` as Route)
                    : (`/upload/${row.id}/edit` as Route);

                  return (
                    <li key={row.id}>
                      <Link
                        href={href}
                        className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-inset p-2 transition-colors outline-none focus-visible:ring-3">
                        <span className="ring-foreground/5 relative block h-11 w-18 shrink-0 overflow-hidden rounded-lg ring-1">
                          {src ?
                            <Image
                              src={src}
                              alt={row.title}
                              fill={true}
                              sizes="72px"
                              placeholder={row.blurDataUrl ? "blur" : "empty"}
                              blurDataURL={row.blurDataUrl ?? undefined}
                              className="pointer-events-none object-cover"
                            />
                          : <span className="bg-muted flex size-full items-center justify-center">
                              <ImagesIcon className="text-muted-foreground size-4" />
                            </span>
                          }
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="text-body-sm truncate font-medium">
                            {row.title}
                          </span>
                          <time
                            suppressHydrationWarning={true}
                            dateTime={row.createdAt}
                            className="text-caption text-muted-foreground">
                            {formatDate(row.createdAt)}
                          </time>
                        </span>
                        <StatusBadge status={status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            }
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ?
              <EmptyState
                compact={true}
                icon={HeartIcon}
                title="No favorites yet"
                description="Save wallpapers while browsing to collect them here."
                action={
                  <Link
                    href={"/browse" as Route}
                    className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <CompassIcon data-icon="inline-start" />
                    Browse gallery
                  </Link>
                }
              />
            : <ul className="grid gap-2 md:grid-cols-2">
                {favorites.map((row) => {
                  const src = toImagePath(
                    row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
                  );

                  return (
                    <li key={row.id}>
                      <Link
                        href={`/browse?preview=${row.slug}` as Route}
                        className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-inset p-2 transition-colors outline-none focus-visible:ring-3">
                        <span className="ring-foreground/5 relative block h-11 w-18 shrink-0 overflow-hidden rounded-lg ring-1">
                          {src ?
                            <Image
                              src={src}
                              alt={row.title}
                              fill={true}
                              sizes="72px"
                              placeholder={row.blurDataUrl ? "blur" : "empty"}
                              blurDataURL={row.blurDataUrl ?? undefined}
                              className="pointer-events-none object-cover"
                            />
                          : <span className="bg-muted flex size-full items-center justify-center">
                              <ImagesIcon className="text-muted-foreground size-4" />
                            </span>
                          }
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="text-body-sm truncate font-medium">
                            {row.title}
                          </span>
                          <span className="text-caption text-muted-foreground truncate">
                            By {row.uploaderName} &middot; Saved{" "}
                            {formatDate(row.favoritedAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            }
          </TabsContent>

          <TabsContent value="boards">
            {boards.length === 0 ?
              <EmptyState
                compact={true}
                icon={FolderHeartIcon}
                title="No personal boards yet"
                description="Group wallpapers into custom boards directly from Browse or Collections."
                action={
                  <Link
                    href={"/collections?tab=mine" as Route}
                    className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <FolderHeartIcon data-icon="inline-start" />
                    Manage boards
                  </Link>
                }
              />
            : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {boards.map((board) => {
                  const coverSrc = toImagePath(board.coverUrl);
                  return (
                    <Link
                      key={board.id}
                      href={`/collections/${board.slug}` as Route}
                      className="border-border/70 bg-card/60 hover:bg-muted/40 flex h-full flex-col overflow-hidden rounded-inset border transition-colors">
                      <div className="bg-muted/40 relative aspect-16/9 w-full overflow-hidden">
                        {coverSrc ?
                          <Image
                            src={coverSrc}
                            alt={board.title}
                            fill={true}
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        : <div className="flex size-full items-center justify-center">
                            <FolderHeartIcon className="text-muted-foreground size-6" />
                          </div>
                        }
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-2 p-3">
                        <div className="grid min-w-0 gap-0.5">
                          <span className="truncate text-sm font-medium">
                            {board.title}
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {board.itemCount} items
                          </span>
                        </div>
                        {!board.isPublicToMembers ?
                          <Badge variant="outline">
                            <LockIcon data-icon="inline-start" />
                            Private
                          </Badge>
                        : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            }
          </TabsContent>

          <TabsContent value="downloads">
            {downloads.length === 0 ?
              <EmptyState
                compact={true}
                icon={DownloadIcon}
                title="No download history yet"
                description="Wallpapers you download across resolutions appear here for quick re-access."
                action={
                  <Link
                    href={"/browse" as Route}
                    className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <CompassIcon data-icon="inline-start" />
                    Browse gallery
                  </Link>
                }
              />
            : <ul className="grid gap-2 md:grid-cols-2">
                {downloads.map((log) => {
                  const src = toImagePath(log.thumb400Url);
                  return (
                    <li key={log.id}>
                      <Link
                        href={`/browse?preview=${log.slug}` as Route}
                        className="hover:bg-muted/40 flex items-center gap-3 rounded-inset p-2 transition-colors">
                        <span className="ring-foreground/5 relative block h-11 w-18 shrink-0 overflow-hidden rounded-lg ring-1">
                          {src ?
                            <Image
                              src={src}
                              alt={log.title}
                              fill={true}
                              sizes="72px"
                              placeholder={log.blurDataUrl ? "blur" : "empty"}
                              blurDataURL={log.blurDataUrl ?? undefined}
                              className="object-cover"
                            />
                          : <span className="bg-muted flex size-full items-center justify-center">
                              <ImagesIcon className="text-muted-foreground size-4" />
                            </span>
                          }
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="text-body-sm truncate font-medium">
                            {log.title}
                          </span>
                          <span className="text-caption text-muted-foreground truncate">
                            {log.variant === "original" ?
                              "Original resolution"
                            : `${log.variant}px WebP`}{" "}
                            &middot; {formatRelativeDate(log.downloadedAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            }
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ProfileLibraryTabs;
