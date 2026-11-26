"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { formatCompactCount, formatRelativeDate, initialsOf } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { DownloadIcon, EyeIcon, HeartIcon, ImagesIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";
import CopyLinkButton from "./CopyLinkButton";
import DownloadWallpaperButton from "./DownloadWallpaperButton";
import FavoriteButton from "./FavoriteButton";
import ReportWallpaperButton from "./ReportWallpaper";
import ViewOriginalButton from "./ViewOriginalButton";

type BrowseGridProps = {
  wallpapers: BrowseWallpaper[];
  reportedIds?: string[];
  showReport?: boolean;
};

const cardImage = (item: BrowseWallpaper) =>
  toImagePath(
    item.thumb400Url ??
      item.thumb800Url ??
      item.thumb1920Url ??
      item.originalUrl,
  );

const quickDownloadUrl = (item: BrowseWallpaper) =>
  item.originalUrl ?? item.thumb1920Url ?? item.thumb800Url ?? null;

type BrowseGridCardProps = {
  item: BrowseWallpaper;
  reported: boolean;
  showReport: boolean;
  index: number;
};

const BrowseGridCard = ({
  item,
  reported,
  showReport,
  index,
}: BrowseGridCardProps) => {
  const [, setPreview] = useQueryState("preview", browseParsers.preview);
  const [downloads, setDownloads] = useState(item.downloadCount);
  const [favorite, setFavorite] = useState({
    favorited: item.favoritedByMe,
    count: item.favoriteCount,
  });

  const src = cardImage(item);
  const firstColor = item.dominantColors[0];

  return (
    <article
      style={{ "--stagger": Math.min(index, 7) } as React.CSSProperties}
      className="gallery-stagger group/card relative h-full break-inside-avoid">
      <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-inset border shadow-lg shadow-black/20 transition-shadow duration-base group-focus-within/card:shadow-xl group-hover/card:shadow-xl">
        <div className="relative aspect-4/3 overflow-hidden bg-muted/30">
          {src ?
            <Image
              src={src}
              alt={item.title}
              width={item.width ?? 800}
              height={item.height ?? 600}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
              placeholder={item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={item.blurDataUrl ?? undefined}
              className="size-full object-cover transition-transform duration-base select-none motion-safe:group-hover/card:scale-[1.03]"
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
            className="focus-visible:ring-ring/60 absolute inset-0 z-10 cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-inset"
          />

          {/* Compact single action for touch / mobile */}
          <div className="absolute right-2 bottom-2 z-20 md:hidden">
            <FavoriteButton
              wallpaperId={item.id}
              favorited={favorite.favorited}
              favoriteCount={favorite.count}
              onUpdated={(favorited, count) =>
                setFavorite({ favorited, count })
              }
              size="icon-sm"
              variant="secondary"
              iconOnly={true}
              className="bg-black/60 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-black/75"
            />
          </div>

          {/* Full hover / focus-within action bar on desktop */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 hidden flex-wrap gap-1 rounded-inset bg-black/60 p-1 opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-opacity duration-fast group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 md:flex">
            <DownloadWallpaperButton
              wallpaperId={item.id}
              downloadUrl={quickDownloadUrl(item)}
              downloadCount={downloads}
              onUpdated={(next) =>
                setDownloads(next === null ? item.downloadCount : next)
              }
              size="xs"
            />
            <FavoriteButton
              wallpaperId={item.id}
              favorited={favorite.favorited}
              favoriteCount={favorite.count}
              onUpdated={(favorited, count) =>
                setFavorite({ favorited, count })
              }
              size="xs"
            />
            <CopyLinkButton
              slug={item.slug}
              size="xs"
            />
            <ViewOriginalButton
              originalUrl={item.originalUrl}
              size="xs"
            />
            {showReport ?
              <ReportWallpaperButton
                wallpaperId={item.id}
                wallpaperTitle={item.title}
                reported={reported}
                size="xs"
              />
            : null}
          </div>
        </div>

        <div className="grid flex-1 content-start gap-2.5 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-body-sm line-clamp-2 font-medium text-foreground">
              {item.title}
            </h3>
            {item.width && item.height ?
              <span className="text-caption text-muted-foreground shrink-0 font-mono tabular-nums">
                {`${item.width}x${item.height}`}
              </span>
            : null}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <Avatar size="sm">
                {item.uploader.image ?
                  <AvatarImage
                    src={item.uploader.image}
                    alt={item.uploader.name}
                  />
                : null}
                <AvatarFallback>
                  {initialsOf(item.uploader.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-caption text-muted-foreground truncate">
                {item.uploader.name}
              </span>
            </span>
            <time
              suppressHydrationWarning={true}
              dateTime={new Date(item.createdAt).toISOString()}
              className="text-caption text-muted-foreground shrink-0">
              {formatRelativeDate(item.createdAt)}
            </time>
          </div>
          <div className="text-caption text-muted-foreground flex items-center gap-3 tabular-nums">
            <span className="flex items-center gap-1">
              <EyeIcon
                aria-hidden="true"
                className="size-3.5"
              />
              {formatCompactCount(item.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <DownloadIcon
                aria-hidden="true"
                className="size-3.5"
              />
              {formatCompactCount(downloads)}
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                favorite.favorited && "text-rose-300",
              )}>
              <HeartIcon
                aria-hidden="true"
                className={cn("size-3.5", favorite.favorited && "fill-current")}
              />
              {formatCompactCount(favorite.count)}
            </span>
          </div>
          {item.tags.length > 0 ?
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((entry) => (
                <Badge
                  key={entry.tag.id}
                  variant="secondary">
                  {entry.tag.name}
                </Badge>
              ))}
              {item.tags.length > 3 ?
                <Badge variant="outline">{`+${item.tags.length - 3}`}</Badge>
              : null}
            </div>
          : null}
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
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
