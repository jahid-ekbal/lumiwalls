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
import { incrementDownloadCount } from "@/server/actions/browse";
import { DownloadIcon, EyeIcon, ImagesIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "react-toastify";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";

type WallpaperPreviewProps = {
  wallpapers: BrowseWallpaper[];
  previewWallpaper: BrowseWallpaper | null;
};

const initials = (name: string) => {
  const source = name.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
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

const PreviewDetails = ({ item }: { item: BrowseWallpaper }) => {
  const [downloadCount, setDownloadCount] = useState(item.downloadCount);
  const [downloading, setDownloading] = useState(false);

  const largeImage =
    item.thumb1920Url ??
    item.thumb800Url ??
    item.originalUrl ??
    item.thumb400Url;
  const downloadUrl = item.originalUrl ?? largeImage;

  const handleDownload = async () => {
    if (downloading) {
      return;
    }
    const previous = downloadCount;
    setDownloadCount(previous + 1);
    setDownloading(true);
    try {
      const result = await incrementDownloadCount({ wallpaperId: item.id });
      if (result.success) {
        setDownloadCount(result.downloadCount);
      } else {
        setDownloadCount(previous);
        toast.error("Download failed, please try again");
      }
    } catch {
      setDownloadCount(previous);
      toast.error("Download failed, please try again");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{item.title}</DialogTitle>
        <DialogDescription>
          {item.category ? `${item.category.name} wallpaper` : "Wallpaper"}
        </DialogDescription>
      </DialogHeader>
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-2xl">
        {largeImage ?
          <Image
            src={largeImage}
            alt={item.title}
            fill={true}
            sizes="(max-width: 768px) 90vw, 720px"
            placeholder={item.blurDataUrl ? "blur" : "empty"}
            blurDataURL={item.blurDataUrl ?? undefined}
            className="object-cover"
          />
        : <div className="flex h-full w-full items-center justify-center">
            <ImagesIcon className="text-muted-foreground size-8" />
          </div>
        }
      </div>
      {item.description ?
        <p className="text-muted-foreground text-sm">{item.description}</p>
      : null}
      <div className="flex flex-wrap gap-1.5">
        {item.category ?
          <Badge variant="secondary">{item.category.name}</Badge>
        : null}
        {item.featured ?
          <Badge>Featured</Badge>
        : null}
        {item.editorsPick ?
          <Badge variant="outline">Editor pick</Badge>
        : null}
        {item.aspectRatio ?
          <Badge variant="outline">{item.aspectRatio}</Badge>
        : null}
        {item.format ?
          <Badge variant="outline">{item.format.toUpperCase()}</Badge>
        : null}
      </div>
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
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Dimensions</dt>
          <dd>
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
          <dd>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Colors</dt>
          <dd>
            {item.dominantColors.length > 0 ?
              item.dominantColors.slice(0, 3).join(", ")
            : "Unknown"}
          </dd>
        </div>
      </dl>
      {item.dominantColors.length > 0 ?
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
      : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Avatar size="sm">
            {item.uploader.image ?
              <AvatarImage
                src={item.uploader.image}
                alt={item.uploader.name}
              />
            : null}
            <AvatarFallback>{initials(item.uploader.name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{item.uploader.name}</span>
        </span>
        <span className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <EyeIcon className="size-3.5" />
            {item.viewCount.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1">
            <DownloadIcon className="size-3.5" />
            {downloadCount.toLocaleString()} downloads
          </span>
        </span>
      </div>
      <div className="flex justify-end">
        {downloadUrl ?
          <a
            href={downloadUrl}
            download={true}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void handleDownload();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center justify-center gap-1.5 rounded-4xl px-3 text-sm font-medium transition">
            {downloading ?
              <Loader2Icon className="size-4 animate-spin" />
            : <DownloadIcon className="size-4" />}
            Download original
          </a>
        : <Button
            type="button"
            disabled={true}>
            No file available
          </Button>
        }
      </div>
    </div>
  );
};

const WallpaperPreview = ({
  wallpapers,
  previewWallpaper,
}: WallpaperPreviewProps) => {
  const [preview, setPreview] = useQueryState("preview", browseParsers.preview);
  const selected =
    previewWallpaper ??
    wallpapers.find((item) => item.slug === preview) ??
    null;
  const open = preview !== "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          void setPreview("");
        }
      }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {!selected ?
          <DialogHeader>
            <DialogTitle>Preview not available</DialogTitle>
            <DialogDescription>
              This wallpaper is not available, it may be pending review or
              removed.
            </DialogDescription>
          </DialogHeader>
        : <PreviewDetails
            key={selected.id}
            item={selected}
          />
        }
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperPreview;
