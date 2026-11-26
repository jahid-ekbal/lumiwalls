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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/shadcnui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcnui/tooltip";
import { colorBucketIndex } from "@/lib/colorBuckets";
import {
  formatBytes,
  formatDate,
  formatPluralCount,
  formatRelativeDate,
  initialsOf,
} from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { trackWallpaperView } from "@/server/actions/browse";
import { toggleFavorite } from "@/server/actions/favorites";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  FlagIcon,
  HeartIcon,
  ImagesIcon,
  Link2Icon,
  MoreHorizontalIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { ViewTransition, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";
import FavoriteButton from "./FavoriteButton";
import { useGallerySync } from "./GallerySyncContext";
import { ReportDialog } from "./ReportWallpaper";
import ResolutionPickerButton from "./ResolutionPickerButton";
import SaveToBoardButton from "./SaveToBoardButton";
import { useDownloadWallpaper } from "./useDownloadWallpaper";

type WallpaperPreviewProps = {
  wallpapers: BrowseWallpaper[];
  previewWallpaper: BrowseWallpaper | null;
  reportedIds?: string[];
};

const clampPan = (value: number) => Math.max(-240, Math.min(240, value));

type StagePointer = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type LightboxDetailsProps = {
  item: BrowseWallpaper;
  reported: boolean;
  downloads: number;
  onDownloadsChange: (next: number) => void;
  favorite: { favorited: boolean; count: number };
  onFavoriteChange: (favorited: boolean, count: number) => void;
  onClosePreview: () => void;
};

const LightboxActions = ({
  item,
  reported,
  downloads,
  onDownloadsChange,
  favorite,
  onFavoriteChange,
}: Omit<LightboxDetailsProps, "onClosePreview">) => {
  const sync = useGallerySync();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportedLocal, setReportedLocal] = useState(reported);

  const handleCopy = async () => {
    const url = `${window.location.origin}/browse?preview=${encodeURIComponent(item.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const originalPath = toImagePath(item.originalUrl) ?? item.originalUrl;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ResolutionPickerButton
          wallpaperId={item.id}
          slug={item.slug}
          width={item.width}
          height={item.height}
          fileSize={item.fileSize}
          format={item.format}
          urls={{
            thumb400Url: item.thumb400Url,
            thumb800Url: item.thumb800Url,
            thumb1920Url: item.thumb1920Url,
            originalUrl: item.originalUrl,
          }}
          downloadCount={downloads}
          onUpdated={(next) =>
            onDownloadsChange(next === null ? item.downloadCount : next)
          }
          size="default"
          className="flex-1"
        />
        <FavoriteButton
          wallpaperId={item.id}
          favorited={favorite.favorited}
          favoriteCount={favorite.count}
          onUpdated={onFavoriteChange}
          variant="outline"
          size="default"
        />
        {sync ?
          <SaveToBoardButton
            wallpaperId={item.id}
            size="default"
            variant="outline"
          />
        : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="More wallpaper actions">
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void handleCopy()}>
                <Link2Icon />
                Copy link
              </DropdownMenuItem>
              {originalPath ?
                <DropdownMenuItem
                  render={
                    <a
                      href={originalPath}
                      target="_blank"
                      rel="noreferrer">
                      <ExternalLinkIcon />
                      View original
                    </a>
                  }
                />
              : null}
              <DropdownMenuItem
                disabled={reportedLocal}
                onClick={() => setReportOpen(true)}>
                <FlagIcon />
                {reportedLocal ? "Reported" : "Report wallpaper"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ReportDialog
        wallpaperId={item.id}
        wallpaperTitle={item.title}
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmitted={() => setReportedLocal(true)}
      />
    </>
  );
};

const LightboxRailContent = ({
  item,
  reported,
  downloads,
  onDownloadsChange,
  favorite,
  onFavoriteChange,
  onClosePreview,
}: LightboxDetailsProps) => {
  const uploaderAvatar = toImagePath(item.uploader.image);

  const handleCopyColor = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex}`);
    } catch {
      toast.error("Could not copy color");
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-5 p-5">
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap items-center gap-1.5 pr-10">
          {item.category ?
            <Link
              href={`/browse?category=${encodeURIComponent(item.category.slug)}` as Route}
              onClick={onClosePreview}>
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 cursor-pointer">
                {item.category.name}
              </Badge>
            </Link>
          : null}
          {item.featured ? <Badge>Featured</Badge> : null}
          {item.editorsPick ?
            <Badge variant="outline">Editors pick</Badge>
          : null}
        </div>

        <div className="grid gap-1.5">
          <h2 className="font-heading text-h2 font-semibold tracking-tight text-balance">
            {item.title}
          </h2>
          {item.description ?
            <p className="text-body-sm text-muted-foreground leading-relaxed text-pretty">
              {item.description}
            </p>
          : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          {item.uploader.handle ?
            <Link
              href={`/u/${item.uploader.handle}` as Route}
              onClick={onClosePreview}
              className="group/creator flex min-w-0 items-center gap-2 rounded-sm focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none">
              <Avatar size="sm">
                {uploaderAvatar ?
                  <AvatarImage
                    src={uploaderAvatar}
                    alt={item.uploader.name}
                  />
                : null}
                <AvatarFallback>{initialsOf(item.uploader.name)}</AvatarFallback>
              </Avatar>
              <span className="text-body-sm group-hover/creator:underline truncate font-medium">
                {item.uploader.name}
              </span>
            </Link>
          : <span className="flex min-w-0 items-center gap-2">
              <Avatar size="sm">
                {uploaderAvatar ?
                  <AvatarImage
                    src={uploaderAvatar}
                    alt={item.uploader.name}
                  />
                : null}
                <AvatarFallback>{initialsOf(item.uploader.name)}</AvatarFallback>
              </Avatar>
              <span className="text-body-sm truncate font-medium">
                {item.uploader.name}
              </span>
            </span>
          }
          <Tooltip>
            <TooltipTrigger
              render={
                <time
                  suppressHydrationWarning={true}
                  dateTime={new Date(item.createdAt).toISOString()}
                  className="text-caption text-muted-foreground shrink-0 cursor-default underline decoration-dotted underline-offset-4">
                  {formatRelativeDate(item.createdAt)}
                </time>
              }
            />
            <TooltipContent>
              {formatDate(item.createdAt, "PPP")}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="text-caption text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
          <span className="flex items-center gap-1.5">
            <EyeIcon
              aria-hidden="true"
              className="size-3.5"
            />
            {formatPluralCount(item.viewCount, "view", "views", {
              compact: true,
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <DownloadIcon
              aria-hidden="true"
              className="size-3.5"
            />
            {formatPluralCount(downloads, "download", "downloads", {
              compact: true,
            })}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              favorite.favorited && "text-rose-500 dark:text-rose-400",
            )}>
            <HeartIcon
              aria-hidden="true"
              className={cn("size-3.5", favorite.favorited && "fill-current")}
            />
            {formatPluralCount(favorite.count, "favorite", "favorites", {
              compact: true,
            })}
          </span>
        </div>

        <dl className="border-border/60 bg-card/50 grid grid-cols-2 gap-3 rounded-inset border p-3.5 text-xs">
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Dimensions</dt>
            <dd className="font-mono tabular-nums">
              {item.width && item.height ?
                `${item.width} x ${item.height}`
              : "Unknown"}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">File size</dt>
            <dd className="font-mono tabular-nums">
              {formatBytes(item.fileSize, "Unknown")}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Aspect</dt>
            <dd className="font-mono">{item.aspectRatio ?? "Auto"}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Format</dt>
            <dd className="font-mono uppercase">
              {item.format ?? "Unknown"}
            </dd>
          </div>
        </dl>

        {item.dominantColors.length > 0 ?
          <div className="grid gap-2">
            <span className="text-caption text-muted-foreground">
              Dominant palette (click to copy or filter)
            </span>
            <div className="flex flex-wrap gap-2">
              {item.dominantColors.slice(0, 6).map((color) => {
                const bucket = colorBucketIndex(color);
                return (
                  <Tooltip key={color}>
                    <TooltipTrigger
                      render={
                        bucket !== null ?
                          <Link
                            href={`/browse?colors=${bucket}` as Route}
                            onClick={onClosePreview}
                            aria-label={`Filter by ${color}`}
                            className="ring-border hover:ring-foreground inline-block size-6 rounded-full ring-1 transition"
                            style={{ backgroundColor: color }}
                          />
                        : <button
                            type="button"
                            aria-label={`Copy color ${color}`}
                            onClick={() => void handleCopyColor(color)}
                            className="ring-border hover:ring-foreground size-6 rounded-full ring-1 transition"
                            style={{ backgroundColor: color }}
                          />
                      }
                    />
                    <TooltipContent>
                      {color}
                      {bucket !== null ? " (click to filter)" : ""}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        : null}

        {item.tags.length > 0 ?
          <div className="grid gap-2">
            <span className="text-caption text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((entry) => (
                <Link
                  key={entry.tag.id}
                  href={`/browse?tags=${encodeURIComponent(entry.tag.slug)}` as Route}
                  onClick={onClosePreview}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-secondary/80 cursor-pointer">
                    #{entry.tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        : null}

        <p className="text-caption text-muted-foreground hidden lg:block">
          Shortcuts: Arrows navigate &middot; Z zoom &middot; F favorite &middot; D download
        </p>
      </div>

      <div className="border-border/60 border-t pt-4">
        <LightboxActions
          item={item}
          reported={reported}
          downloads={downloads}
          onDownloadsChange={onDownloadsChange}
          favorite={favorite}
          onFavoriteChange={onFavoriteChange}
        />
      </div>
    </div>
  );
};

const SelectedPreviewContent = ({
  selected,
  reported,
  currentIndex,
  totalCount,
  canPrev,
  canNext,
  goPrev,
  goNext,
  zoom,
  pan,
  onToggleZoom,
  onResetZoom,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClosePreview,
}: {
  selected: BrowseWallpaper;
  reported: boolean;
  currentIndex: number;
  totalCount: number;
  canPrev: boolean;
  canNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  zoom: boolean;
  pan: { x: number; y: number };
  onToggleZoom: () => void;
  onResetZoom: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onClosePreview: () => void;
}) => {
  const sync = useGallerySync();
  const [localDownloads, setLocalDownloads] = useState<number | null>(null);
  const [localFavorite, setLocalFavorite] = useState<{
    favorited: boolean;
    count: number;
  } | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const synced = sync?.getState(selected);
  const downloads =
    localDownloads ?? synced?.downloadCount ?? selected.downloadCount;
  const favorite = localFavorite ?? {
    favorited: synced?.favorited ?? selected.favoritedByMe,
    count: synced?.favoriteCount ?? selected.favoriteCount,
  };

  useEffect(() => {
    const key = `lumiwalls:viewed:${selected.id}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") {
        return;
      }
      window.sessionStorage.setItem(key, "1");
      void trackWallpaperView({ wallpaperId: selected.id }).catch(
        () => undefined,
      );
    } catch {
      void trackWallpaperView({ wallpaperId: selected.id }).catch(
        () => undefined,
      );
    }
  }, [selected.id]);

  const stageUrl = toImagePath(
    (zoom ? selected.originalUrl : null) ??
      selected.thumb1920Url ??
      selected.thumb800Url ??
      selected.originalUrl ??
      selected.thumb400Url,
  );

  const handleDownloadsChange = (next: number) => {
    setLocalDownloads(next);
    sync?.setDownloadCountState(selected.id, next);
  };

  const handleFavoriteChange = (favorited: boolean, count: number) => {
    setLocalFavorite({ favorited, count });
    sync?.setFavoriteState(selected.id, favorited, count);
  };

  return (
    <div className="flex max-h-[92dvh] flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
      <DialogTitle className="sr-only">{selected.title}</DialogTitle>
      <DialogDescription className="sr-only">
        {selected.category ? `${selected.category.name} wallpaper` : "Wallpaper"}
      </DialogDescription>

      <div
        className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-neutral-950 p-4 sm:p-6 lg:min-h-[460px]"
        onClick={() => {
          if (zoom) onResetZoom();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}>
        {stageUrl ?
          <ViewTransition default="none">
            <Image
              src={stageUrl}
              alt={selected.title}
              width={selected.width ?? 1920}
              height={selected.height ?? 1080}
              sizes="(max-width: 1024px) 100vw, 1100px"
              placeholder={selected.blurDataUrl ? "blur" : "empty"}
              blurDataURL={selected.blurDataUrl ?? undefined}
              priority={true}
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                onToggleZoom();
              }}
              className={cn(
                "h-auto max-h-[64dvh] w-auto max-w-full rounded-lg object-contain transition-transform duration-base select-none lg:max-h-[82dvh]",
                zoom ? "cursor-zoom-out" : "cursor-zoom-in",
              )}
              style={
                zoom ?
                  {
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(1.75)`,
                  }
                : undefined
              }
            />
          </ViewTransition>
        : <div className="flex w-full items-center justify-center py-24">
            <ImagesIcon className="text-muted-foreground size-10" />
          </div>
        }

        {stageUrl ?
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            aria-pressed={zoom}
            className="absolute top-3 left-3 z-20 size-10 rounded-full bg-neutral-900/80 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-neutral-800 hover:text-white"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onToggleZoom();
            }}>
            {zoom ?
              <ZoomOutIcon aria-hidden="true" />
            : <ZoomInIcon aria-hidden="true" />}
          </Button>
        : null}

        {totalCount > 0 && currentIndex >= 0 ?
          <div
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="bg-background/90 ring-border/70 absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full p-1 shadow-xl ring-1 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              disabled={!canPrev}
              aria-label="Previous wallpaper"
              className="size-11 rounded-full"
              onClick={goPrev}>
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            <span
              aria-live="polite"
              className="text-caption text-foreground px-2 font-medium tabular-nums">
              {`${currentIndex + 1} of ${totalCount}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              disabled={!canNext}
              aria-label="Next wallpaper"
              className="size-11 rounded-full"
              onClick={goNext}>
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </div>
        : null}
      </div>

      <aside
        aria-label="Wallpaper details"
        className="border-border/50 hidden max-h-[92dvh] overflow-y-auto border-l lg:block">
        <LightboxRailContent
          item={selected}
          reported={reported}
          downloads={downloads}
          onDownloadsChange={handleDownloadsChange}
          favorite={favorite}
          onFavoriteChange={handleFavoriteChange}
          onClosePreview={onClosePreview}
        />
      </aside>

      <div className="border-border/60 bg-card/95 flex flex-col gap-3 border-t p-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          aria-expanded={mobileSheetOpen}
          aria-label="Open wallpaper details sheet"
          className="focus-visible:ring-ring/50 flex w-full flex-col items-center gap-2 rounded-inset py-1 text-left outline-none focus-visible:ring-3">
          <span
            aria-hidden="true"
            className="bg-muted-foreground/40 h-1.5 w-10 rounded-full"
          />
          <div className="flex w-full items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-body-sm truncate font-medium">
                {selected.title}
              </p>
              <p className="text-caption text-muted-foreground truncate">
                {selected.uploader.name}
                {selected.width && selected.height ?
                  ` · ${selected.width}x${selected.height}`
                : ""}
              </p>
            </div>
            <span className="text-caption text-muted-foreground inline-flex shrink-0 items-center gap-1">
              Details
              <ChevronUpIcon
                aria-hidden="true"
                className="size-4"
              />
            </span>
          </div>
        </button>

        <LightboxActions
          item={selected}
          reported={reported}
          downloads={downloads}
          onDownloadsChange={handleDownloadsChange}
          favorite={favorite}
          onFavoriteChange={handleFavoriteChange}
        />

        <Sheet
          open={mobileSheetOpen}
          onOpenChange={setMobileSheetOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[82dvh] rounded-t-overlay p-0">
            <div className="flex justify-center pt-3">
              <span
                aria-hidden="true"
                className="bg-muted-foreground/40 h-1.5 w-10 rounded-full"
              />
            </div>
            <SheetHeader className="sr-only">
              <SheetTitle>{selected.title}</SheetTitle>
              <SheetDescription>Wallpaper details and actions</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto">
              <LightboxRailContent
                item={selected}
                reported={reported}
                downloads={downloads}
                onDownloadsChange={handleDownloadsChange}
                favorite={favorite}
                onFavoriteChange={handleFavoriteChange}
                onClosePreview={onClosePreview}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

const WallpaperPreview = ({
  wallpapers,
  previewWallpaper,
  reportedIds = [],
}: WallpaperPreviewProps) => {
  const sync = useGallerySync();
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

  const { trigger: triggerQuickDownload } = useDownloadWallpaper({
    wallpaperId: selected?.id ?? "",
    slug: selected?.slug,
    downloadCount:
      selected ?
        (sync?.getState(selected).downloadCount ?? selected.downloadCount)
      : 0,
    onUpdated: (next) => {
      if (selected && next !== null) {
        sync?.setDownloadCountState(selected.id, next);
      }
    },
  });

  const resetZoom = useCallback(() => {
    setZoom(false);
    setPan({ x: 0, y: 0 });
  }, []);

  const closePreview = useCallback(() => {
    void setPreview("");
    resetZoom();
  }, [resetZoom, setPreview]);

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
    if (!open || !selected) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (inInput) return;

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
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        goNext();
        return;
      }
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        setZoom((z) => {
          if (z) setPan({ x: 0, y: 0 });
          return !z;
        });
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFavorite({ wallpaperId: selected.id }).then((res) => {
          if (res.success) {
            sync?.setFavoriteState(
              selected.id,
              res.favorited,
              res.favoriteCount,
            );
          }
        });
        return;
      }
      if (event.key.toLowerCase() === "d") {
        const dlUrl =
          selected.originalUrl ??
          selected.thumb1920Url ??
          selected.thumb800Url ??
          null;
        if (dlUrl) {
          event.preventDefault();
          void triggerQuickDownload(dlUrl, "original");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [goNext, goPrev, open, resetZoom, selected, sync, triggerQuickDownload]);

  const handleToggleZoom = () => {
    if (moved.current) {
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
          closePreview();
        }
      }}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,84rem)] max-w-none max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogClose
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Close preview"
              className="bg-background/90 text-foreground ring-border/70 hover:bg-background absolute top-3 right-3 z-30 size-10 rounded-full ring-1 backdrop-blur-md">
              <XIcon aria-hidden="true" />
            </Button>
          }
        />

        {selected ?
          <SelectedPreviewContent
            key={selected.id}
            selected={selected}
            reported={reportedIds.includes(selected.id)}
            currentIndex={currentIndex}
            totalCount={wallpapers.length}
            canPrev={canPrev}
            canNext={canNext}
            goPrev={goPrev}
            goNext={goNext}
            zoom={zoom}
            pan={pan}
            onToggleZoom={handleToggleZoom}
            onResetZoom={resetZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClosePreview={closePreview}
          />
        : <DialogHeader className="p-6 pr-14">
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
