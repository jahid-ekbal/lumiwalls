"use client";

import EmptyState from "@/components/UI/EmptyState";
import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
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
import { formatDate } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import {
  ArrowRightIcon,
  CompassIcon,
  HeartIcon,
  ImagesIcon,
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

type ProfileLibraryTabsProps = {
  uploads: ProfileLibraryUpload[];
  favorites: ProfileLibraryFavorite[];
};

const ProfileLibraryTabs = ({
  uploads,
  favorites,
}: ProfileLibraryTabsProps) => {
  return (
    <Card>
      <Tabs defaultValue="uploads">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>Library</CardTitle>
              <CardDescription>
                Your recent submissions and saved favorites
              </CardDescription>
            </div>
            <CardAction>
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
            : <ul className="grid gap-2">
                {uploads.map((row) => {
                  const status = deriveWallpaperStatus({
                    isApproved: row.isApproved,
                    moderationStatus: row.moderationStatus,
                  });
                  const src = toImagePath(
                    row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
                  );
                  const isOptimizable = row.isApproved && row.isPublic;
                  const href =
                    row.isApproved ?
                      (`/browse?preview=${row.slug}` as Route)
                    : (`/upload/${row.id}/edit` as Route);

                  return (
                    <li key={row.id}>
                      <Link
                        href={href}
                        className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-inset p-2 transition-colors outline-none focus-visible:ring-3">
                        <span className="ring-foreground/5 relative block h-10 w-16 shrink-0 overflow-hidden rounded-lg ring-1">
                          {src ?
                            isOptimizable ?
                              <Image
                                src={src}
                                alt={row.title}
                                fill={true}
                                sizes="64px"
                                placeholder={row.blurDataUrl ? "blur" : "empty"}
                                blurDataURL={row.blurDataUrl ?? undefined}
                                className="pointer-events-none object-cover"
                              />
                            : /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={src}
                                alt={row.title}
                                loading="lazy"
                                className="pointer-events-none absolute inset-0 size-full object-cover"
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
            : <ul className="grid gap-2">
                {favorites.map((row) => {
                  const src = toImagePath(
                    row.thumb400Url ?? row.thumb800Url ?? row.originalUrl,
                  );

                  return (
                    <li key={row.id}>
                      <Link
                        href={`/browse?preview=${row.slug}` as Route}
                        className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-inset p-2 transition-colors outline-none focus-visible:ring-3">
                        <span className="ring-foreground/5 relative block h-10 w-16 shrink-0 overflow-hidden rounded-lg ring-1">
                          {src ?
                            <Image
                              src={src}
                              alt={row.title}
                              fill={true}
                              sizes="64px"
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
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ProfileLibraryTabs;
