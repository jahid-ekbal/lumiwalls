"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { formatCompactCount, initialsOf } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { DownloadIcon, EyeIcon, HeartIcon, ImagesIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";
import CopyLinkButton from "./CopyLinkButton";
import DownloadWallpaperButton from "./DownloadWallpaperButton";
import FavoriteButton from "./FavoriteButton";
import { useGallerySync } from "./GallerySyncContext";
import ReportWallpaperButton from "./ReportWallpaper";
import SaveToBoardButton from "./SaveToBoardButton";
import ViewOriginalButton from "./ViewOriginalButton";

type BrowseGridProps = {
  wallpapers: BrowseWallpaper[];
  reportedIds?: string[];
  showReport?: boolean;
};

const cardImage = (item: BrowseWallpaper) =>
  toImagePath(
    item.thumb800Url ??
      item.thumb1920Url ??
      item.thumb400Url ??
      item.originalUrl,
  );

const quickDownloadUrl = (item: BrowseWallpaper) =>
  item.originalUrl ?? item.thumb1920Url ?? item.thumb800Url ?? null;

const getClampedAspectRatio = (
  width: number | null,
  height: number | null,
): number => {
  if (!width || !height || width <= 0 || height <= 0) {
    return 4 / 3;
  }
  const raw = width / height;
  // Clamp extreme panoramic or needle ratios so masonry columns stay balanced.
  return Math.max(0.55, Math.min(2.2, raw));
};

type BrowseGridCardProps = {
  item: BrowseWallpaper;
  reported: boolean;
  showReport: boolean;
  index: number;
};

const SCRIM_BTN_CLASS =
  "text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/60";

const BrowseGridCard = ({
  item,
  reported,
  showReport,
  index,
}: BrowseGridCardProps) => {
  const sync = useGallerySync();
  const [, setPreview] = useQueryState("preview", browseParsers.preview);
  const [localDownloads, setLocalDownloads] = useState<number | null>(null);
  const [localFavorite, setLocalFavorite] = useState<{
    favorited: boolean;
    count: number;
  } | null>(null);

  const synced = sync?.getState(item);
  const downloads = localDownloads ?? synced?.downloadCount ?? item.downloadCount;
  const favorite = localFavorite ?? {
    favorited: synced?.favorited ?? item.favoritedByMe,
    count: synced?.favoriteCount ?? item.favoriteCount,
  };

  const src = cardImage(item);
  const firstColor = item.dominantColors[0];
  const aspectRatio = getClampedAspectRatio(item.width, item.height);
  const uploaderAvatar = toImagePath(item.uploader.image);

  return (
    <article
      style={{ "--stagger": Math.min(index, 7) } as React.CSSProperties}
      className="gallery-stagger group/card mb-3.5 break-inside-avoid">
      <div className="border-border/60 bg-card hover:border-foreground/25 relative flex flex-col overflow-hidden rounded-inset border transition-colors duration-base">
        <div
          className="bg-muted/30 relative w-full overflow-hidden"
          style={{ aspectRatio: String(aspectRatio) }}>
          {src ?
            <Image
              src={src}
              alt={item.title}
              fill={true}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              placeholder={item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={item.blurDataUrl ?? undefined}
              className="size-full object-cover transition-transform duration-base select-none motion-safe:group-hover/card:scale-[1.025]"
            />
          : <div className="bg-muted flex size-full items-center justify-center">
              <ImagesIcon className="text-muted-foreground size-6" />
            </div>
          }
          {firstColor ?
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 z-10 h-full w-1"
              style={{ backgroundColor: firstColor }}
            />
          : null}

          <button
            type="button"
            aria-label={`Open ${item.title}`}
            onClick={() => void setPreview(item.slug)}
            className="focus-visible:ring-ring/70 absolute inset-0 z-10 cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-inset"
          />

          {/* Top badges + quick Pinterest-style Save button */}
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-20 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {item.featured ?
                <Badge className="bg-neutral-950/75 text-white ring-1 ring-white/15 backdrop-blur-md">
                  Featured
                </Badge>
              : item.editorsPick ?
                <Badge className="bg-neutral-950/75 text-white ring-1 ring-white/15 backdrop-blur-md">
                  Pick
                </Badge>
              : null}
            </div>
            {sync ?
              <div className="pointer-events-auto opacity-0 transition-opacity duration-fast group-focus-within/card:opacity-100 group-hover/card:opacity-100">
                <SaveToBoardButton
                  wallpaperId={item.id}
                  size="xs"
                  variant="secondary"
                  className="rounded-full bg-neutral-950/80 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-neutral-900 hover:text-white"
                />
              </div>
            : null}
          </div>

          {/* Compact single action for touch / mobile */}
          <div className="absolute right-2 bottom-2 z-20 md:hidden">
            <FavoriteButton
              wallpaperId={item.id}
              favorited={favorite.favorited}
              favoriteCount={favorite.count}
              onUpdated={(favorited, count) => {
                setLocalFavorite({ favorited, count });
                sync?.setFavoriteState(item.id, favorited, count);
              }}
              size="icon-sm"
              variant="secondary"
              iconOnly={true}
              className="min-h-10 min-w-10 rounded-full bg-neutral-950/75 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-neutral-900 hover:text-white"
            />
          </div>

          {/* Desktop hover / focus-within high-contrast dark scrim action bar */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 hidden flex-wrap gap-1 rounded-inset bg-neutral-950/80 p-1 text-white opacity-0 ring-1 ring-white/15 backdrop-blur-md transition-opacity duration-fast group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 md:flex">
            <DownloadWallpaperButton
              wallpaperId={item.id}
              slug={item.slug}
              downloadUrl={quickDownloadUrl(item)}
              downloadCount={downloads}
              onUpdated={(next) => {
                const resolved = next === null ? item.downloadCount : next;
                setLocalDownloads(resolved);
                sync?.setDownloadCountState(item.id, resolved);
              }}
              size="xs"
              className={SCRIM_BTN_CLASS}
            />
            <FavoriteButton
              wallpaperId={item.id}
              favorited={favorite.favorited}
              favoriteCount={favorite.count}
              onUpdated={(favorited, count) => {
                setLocalFavorite({ favorited, count });
                sync?.setFavoriteState(item.id, favorited, count);
              }}
              size="xs"
              className={cn(
                !favorite.favorited && SCRIM_BTN_CLASS,
                favorite.favorited && "hover:bg-white/15",
              )}
            />
            <CopyLinkButton
              slug={item.slug}
              size="xs"
              className={SCRIM_BTN_CLASS}
            />
            <ViewOriginalButton
              originalUrl={item.originalUrl}
              size="xs"
              className={SCRIM_BTN_CLASS}
            />
            {showReport ?
              <ReportWallpaperButton
                wallpaperId={item.id}
                wallpaperTitle={item.title}
                reported={reported}
                size="xs"
                className={SCRIM_BTN_CLASS}
              />
            : null}
          </div>
        </div>

        {/* Sleek single-height caption strip */}
        <div className="grid gap-1.5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-body-sm text-foreground min-w-0 truncate font-medium">
              {item.title}
            </h3>
            {item.width && item.height ?
              <span className="text-caption text-muted-foreground shrink-0 font-mono tabular-nums">
                {`${item.width}x${item.height}`}
              </span>
            : null}
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2">
            {item.uploader.handle ?
              <Link
                href={`/u/${item.uploader.handle}` as Route}
                onClick={(event) => event.stopPropagation()}
                className="group/author flex min-w-0 items-center gap-1.5 rounded-sm focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none">
                <Avatar className="size-5 shrink-0">
                  {uploaderAvatar ?
                    <AvatarImage
                      src={uploaderAvatar}
                      alt={item.uploader.name}
                    />
                  : null}
                  <AvatarFallback className="text-[10px]">
                    {initialsOf(item.uploader.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-caption text-muted-foreground group-hover/author:text-foreground truncate transition-colors">
                  {item.uploader.name}
                </span>
              </Link>
            : <span className="flex min-w-0 items-center gap-1.5">
                <Avatar className="size-5 shrink-0">
                  {uploaderAvatar ?
                    <AvatarImage
                      src={uploaderAvatar}
                      alt={item.uploader.name}
                    />
                  : null}
                  <AvatarFallback className="text-[10px]">
                    {initialsOf(item.uploader.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-caption text-muted-foreground truncate">
                  {item.uploader.name}
                </span>
              </span>
            }

            <div className="text-caption text-muted-foreground flex shrink-0 items-center gap-2.5 tabular-nums">
              <span className="flex items-center gap-1">
                <EyeIcon
                  aria-hidden="true"
                  className="size-3"
                />
                {formatCompactCount(item.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <DownloadIcon
                  aria-hidden="true"
                  className="size-3"
                />
                {formatCompactCount(downloads)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  favorite.favorited && "text-rose-500 dark:text-rose-400",
                )}>
                <HeartIcon
                  aria-hidden="true"
                  className={cn("size-3", favorite.favorited && "fill-current")}
                />
                {formatCompactCount(favorite.count)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const BrowseGrid = ({
  wallpapers,
  reportedIds = [],
  showReport = true,
}: BrowseGridProps) => (
  <div className="columns-1 gap-3.5 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
    {wallpapers.map((item, index) => (
      <BrowseGridCard
        key={item.id}
        item={item}
        reported={reportedIds.includes(item.id)}
        showReport={showReport}
        index={index}
      />
    ))}
  </div>
);

export default BrowseGrid;
