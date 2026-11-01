"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { DownloadIcon, EyeIcon, HeartIcon, ImagesIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";
import CopyLinkButton from "./CopyLinkButton";
import { formatCompactCount, initialsOf } from "./countFormat";
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
};

const BrowseGridCard = ({
  item,
  reported,
  showReport,
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
    <article className="group/card relative h-full break-inside-avoid">
      <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-lg shadow-black/20 transition-shadow duration-200 group-focus-within/card:shadow-xl group-hover/card:shadow-xl">
        <div className="relative h-65">
          {src ?
            <Image
              src={src}
              alt={item.title}
              width={item.width ?? 800}
              height={item.height ?? 600}
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              placeholder={item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={item.blurDataUrl ?? undefined}
              className="h-65 w-full object-cover select-none"
            />
          : <div className="bg-muted flex aspect-4/3 h-65 w-full items-center justify-center">
              <ImagesIcon className="text-muted-foreground size-6" />
            </div>
          }
          {firstColor ?
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 z-5 h-full w-1"
              style={{ backgroundColor: firstColor }}
            />
          : null}
          <button
            type="button"
            aria-label={`Open ${item.title}`}
            onClick={() => void setPreview(item.slug)}
            className="absolute inset-0 z-0 cursor-zoom-in"
          />
          <div className="absolute inset-x-2 bottom-2 z-10 flex flex-wrap gap-1 rounded-xl bg-black/45 p-1 opacity-0 backdrop-blur-md transition-opacity duration-150 group-focus-within/card:opacity-100 group-hover/card:opacity-100 max-md:opacity-100">
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
        <div className="grid gap-2 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium">
              {item.title}
            </span>
            {item.width && item.height ?
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {`${item.width} x ${item.height}`}
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
              <span className="text-muted-foreground truncate text-xs">
                {item.uploader.name}
              </span>
            </span>
            <time
              suppressHydrationWarning={true}
              dateTime={new Date(item.createdAt).toISOString()}
              className="text-muted-foreground shrink-0 text-[11px]">
              {formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
              })}
            </time>
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-[11px] tabular-nums">
            <span className="flex items-center gap-1">
              <EyeIcon className="size-3" />
              {formatCompactCount(item.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <DownloadIcon className="size-3" />
              {formatCompactCount(downloads)}
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                favorite.favorited && "text-rose-300",
              )}>
              <HeartIcon
                className={cn("size-3", favorite.favorited && "fill-current")}
              />
              {formatCompactCount(favorite.count)}
            </span>
          </div>
          {item.tags.length > 0 ?
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((entry) => (
                <Badge
                  key={entry.tag.id}
                  variant="ghost">
                  {entry.tag.name}
                </Badge>
              ))}
              {item.tags.length > 3 ?
                <Badge variant="ghost">{`+${item.tags.length - 3}`}</Badge>
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
    {wallpapers.map((item) => (
      <BrowseGridCard
        key={item.id}
        item={item}
        reported={reportedIds.includes(item.id)}
        showReport={showReport}
      />
    ))}
  </div>
);

export default BrowseGrid;
