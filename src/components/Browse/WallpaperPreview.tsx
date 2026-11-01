"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import CopyLinkButton from "./CopyLinkButton";
import { formatCompactCount, initialsOf } from "./countFormat";
import FavoriteButton from "./FavoriteButton";
import ReportWallpaperButton from "./ReportWallpaper";
import ResolutionPickerButton from "./ResolutionPickerButton";
import ViewOriginalButton from "./ViewOriginalButton";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { trackWallpaperView } from "@/server/actions/browse";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  HeartIcon,
  ImagesIcon,
} from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";

type WallpaperPreviewProps = {
  wallpapers: BrowseWallpaper[];
  previewWallpaper: BrowseWallpaper | null;
  reportedIds?: string[];
};

const formatBytes = (bytes: number | null) => {
  if (bytes === null) {
    return "Unknown size";
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const clampPan = (value: number) => Math.max(-160, Math.min(160, value));

type StagePointer = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
};

const LightboxRail = ({
  item,
  reported,
  index,
  count,
}: {
  item: BrowseWallpaper;
  reported: boolean;
  index: number;
  count: number;
}) => {
  const [downloads, setDownloads] = useState(item.downloadCount);
  const [favorite, setFavorite] = useState({
    favorited: item.favoritedByMe,
    count: item.favoriteCount,
  });

  useEffect(() => {
    const key = `lumiwalls:viewed:${item.id}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") {
        return;
      }
      window.sessionStorage.setItem(key, "1");
      void trackWallpaperView({ wallpaperId: item.id }).catch(() => undefined);
    } catch {
      void trackWallpaperView({ wallpaperId: item.id }).catch(() => undefined);
    }
  }, [item.id]);

  return (
    <div className="grid content-start gap-4 p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {item.category ?
          <Badge variant="secondary">{item.category.name}</Badge>
        : null}
        {item.featured ?
          <Badge>Featured</Badge>
        : null}
        {item.editorsPick ?
          <Badge variant="outline">Editors pick</Badge>
        : null}
        {item.aspectRatio ?
          <Badge variant="outline">{item.aspectRatio}</Badge>
        : null}
        {item.format ?
          <Badge variant="outline">{item.format.toUpperCase()}</Badge>
        : null}
      </div>
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        {item.title}
      </h2>
      {item.description ?
        <p className="text-muted-foreground text-sm leading-relaxed">
          {item.description}
        </p>
      : null}
      {item.tags.length > 0 ?
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((entry) => (
            <Badge
              key={entry.tag.id}
              variant="ghost">
              {entry.tag.name}
            </Badge>
          ))}
        </div>
      : null}
      <dl className="bg-card/50 grid gap-3 rounded-xl border p-3 text-xs sm:grid-cols-2">
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Dimensions</dt>
          <dd className="tabular-nums">
            {item.width && item.height ?
              `${item.width} x ${item.height}`
            : "Unknown"}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">File size</dt>
          <dd>{formatBytes(item.fileSize)}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Uploaded</dt>
          <dd>{format(new Date(item.createdAt), "MMM d, yyyy")}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Added</dt>
          <dd suppressHydrationWarning={true}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </dd>
        </div>
      </dl>
      {item.dominantColors.length > 0 ?
        <div className="grid gap-1.5">
          <span className="text-muted-foreground text-xs">Dominant colors</span>
          <div className="flex gap-1.5">
            {item.dominantColors.slice(0, 6).map((color) => (
              <span
                key={color}
                title={color}
                className="size-5 rounded-full border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      : null}
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              {item.uploader.image ?
                <AvatarImage
                  src={item.uploader.image}
                  alt={item.uploader.name}
                />
              : null}
              <AvatarFallback>{initialsOf(item.uploader.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{item.uploader.name}</span>
          </span>
          {count > 0 && index >= 0 ?
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {`${index + 1} of ${count}`}
            </span>
          : null}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs tabular-nums">
          <span className="flex items-center gap-1">
            <EyeIcon className="size-3.5" />
            {`${formatCompactCount(item.viewCount)} views`}
          </span>
          <span className="flex items-center gap-1">
            <DownloadIcon className="size-3.5" />
            {`${formatCompactCount(downloads)} downloads`}
          </span>
          <span
            className={cn(
              "flex items-center gap-1",
              favorite.favorited && "text-rose-300",
            )}>
            <HeartIcon
              className={cn("size-3.5", favorite.favorited && "fill-current")}
            />
            {`${formatCompactCount(favorite.count)} favorites`}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <ResolutionPickerButton
          wallpaperId={item.id}
          urls={{
            thumb400Url: item.thumb400Url,
            thumb800Url: item.thumb800Url,
            thumb1920Url: item.thumb1920Url,
            originalUrl: item.originalUrl,
          }}
          downloadCount={downloads}
          onUpdated={(next) =>
            setDownloads(next === null ? item.downloadCount : next)
          }
        />
        <FavoriteButton
          wallpaperId={item.id}
          favorited={favorite.favorited}
          favoriteCount={favorite.count}
          onUpdated={(favorited, count) => setFavorite({ favorited, count })}
        />
        <CopyLinkButton slug={item.slug} />
        <ViewOriginalButton originalUrl={item.originalUrl} />
        <ReportWallpaperButton
          wallpaperId={item.id}
          wallpaperTitle={item.title}
          reported={reported}
        />
      </div>
    </div>
  );
};

const WallpaperPreview = ({
  wallpapers,
  previewWallpaper,
  reportedIds = [],
}: WallpaperPreviewProps) => {
  const [preview, setPreview] = useQueryState("preview", browseParsers.preview);
  const [zoom, setZoom] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointer = useRef<StagePointer | null>(null);
  const moved = useRef(false);

  const selected =
    previewWallpaper ??
    wallpapers.find((item) => item.slug === preview) ??
    null;
  const open = preview !== "";

  const currentIndex =
    open && selected ?
      wallpapers.findIndex((item) => item.id === selected.id)
    : -1;
  const canPrev = currentIndex > 0;
  const canNext = wallpapers.length > 0 && currentIndex < wallpapers.length - 1;

  const resetZoom = useCallback(() => {
    setZoom(false);
    setPan({ x: 0, y: 0 });
  }, []);

  const openSlug = useCallback(
    (slug: string) => {
      resetZoom();
      void setPreview(slug);
    },
    [resetZoom, setPreview],
  );

  const goPrev = useCallback(() => {
    if (!canPrev) {
      return;
    }
    const previous = wallpapers[currentIndex - 1];
    if (!previous) {
      return;
    }
    openSlug(previous.slug);
  }, [canPrev, currentIndex, openSlug, wallpapers]);

  const goNext = useCallback(() => {
    if (!canNext) {
      return;
    }
    const next = wallpapers[currentIndex + 1];
    if (!next) {
      return;
    }
    openSlug(next.slug);
  }, [canNext, currentIndex, openSlug, wallpapers]);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!open || currentIndex < 0) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && zoomRef.current) {
        event.preventDefault();
        event.stopPropagation();
        resetZoom();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [goNext, goPrev, currentIndex, open, resetZoom]);

  if (!open) {
    return null;
  }

  const stageUrl =
    selected ?
      toImagePath(
        selected.thumb1920Url ??
          selected.thumb800Url ??
          selected.originalUrl ??
          selected.thumb400Url,
      )
    : null;

  const handleStageClick = () => {
    if (moved.current || !stageUrl) {
      return;
    }
    if (zoom) {
      resetZoom();
    } else {
      setZoom(true);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    moved.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointer.current;
    if (!current) {
      return;
    }
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (
      Math.abs(event.clientX - current.startX) > 8 ||
      Math.abs(event.clientY - current.startY) > 8
    ) {
      current.moved = true;
      moved.current = true;
    }
    if (zoom) {
      setPan((prevPan) => ({
        x: clampPan(prevPan.x + dx),
        y: clampPan(prevPan.y + dy),
      }));
    }
    current.x = event.clientX;
    current.y = event.clientY;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointer.current;
    pointer.current = null;
    if (!current) {
      return;
    }
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (zoom || !current.moved) {
      return;
    }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          void setPreview("");
          resetZoom();
        }
      }}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-5xl",
          selected !== null && "h-[92dvh] max-h-[92dvh]",
        )}>
        {selected ?
          <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <DialogTitle className="sr-only">{selected.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {selected.category ?
                `${selected.category.name} wallpaper`
              : "Wallpaper"}
            </DialogDescription>
            <div
              className={cn(
                "relative flex h-[48dvh] items-center justify-center overflow-hidden bg-black/60 p-2 lg:h-auto lg:min-h-0",
                zoom ? "cursor-zoom-out"
                : stageUrl ? "cursor-zoom-in"
                : null,
              )}
              onClick={handleStageClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}>
              {stageUrl ?
                <Image
                  src={stageUrl}
                  alt={selected.title}
                  width={selected.width ?? 1920}
                  height={selected.height ?? 1080}
                  sizes="(max-width: 1024px) 100vw, 720px"
                  placeholder={selected.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={selected.blurDataUrl ?? undefined}
                  priority={true}
                  draggable={false}
                  className={cn(
                    "h-auto max-h-[78dvh] w-auto max-w-full select-none",
                    zoom && "scale-125",
                  )}
                  style={
                    zoom ?
                      { transform: `translate(${pan.x}px, ${pan.y}px)` }
                    : undefined
                  }
                />
              : <div className="flex w-full items-center justify-center">
                  <ImagesIcon className="text-muted-foreground size-10" />
                </div>
              }
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={!canPrev}
                className="absolute top-1/2 left-3 z-20 -translate-y-1/2 border-transparent bg-black/50 text-white hover:bg-black/70"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  goPrev();
                }}>
                <ChevronLeftIcon className="size-4" />
                <span className="sr-only">Previous wallpaper</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={!canNext}
                className="absolute top-1/2 right-3 z-20 -translate-y-1/2 border-transparent bg-black/50 text-white hover:bg-black/70"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  goNext();
                }}>
                <ChevronRightIcon className="size-4" />
                <span className="sr-only">Next wallpaper</span>
              </Button>
            </div>
            <div className="border-border/40 min-h-0 flex-1 overflow-y-auto border-t lg:border-t-0">
              <LightboxRail
                key={selected.id}
                item={selected}
                reported={reportedIds.includes(selected.id)}
                index={currentIndex}
                count={wallpapers.length}
              />
            </div>
          </div>
        : <DialogHeader className="p-6">
            <DialogTitle>Preview not available</DialogTitle>
            <DialogDescription>
              This wallpaper is not available, it may be pending review or
              removed.
            </DialogDescription>
          </DialogHeader>
        }
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperPreview;
