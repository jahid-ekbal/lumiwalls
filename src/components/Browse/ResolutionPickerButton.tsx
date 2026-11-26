"use client";

import { buttonVariants } from "@/components/shadcnui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { formatBytes } from "@/lib/format";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import {
  type DownloadVariant,
  useDownloadWallpaper,
} from "./useDownloadWallpaper";

export type WallpaperUrlSet = {
  thumb400Url: string | null;
  thumb800Url: string | null;
  thumb1920Url: string | null;
  originalUrl: string | null;
};

type ResolutionPickerButtonProps = {
  wallpaperId: string;
  slug?: string;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  format?: string | null;
  urls: WallpaperUrlSet;
  downloadCount: number;
  onUpdated?: (downloadCount: number | null) => void;
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
};

const ResolutionPickerButton = ({
  wallpaperId,
  slug,
  width,
  height,
  fileSize,
  format,
  urls,
  downloadCount,
  onUpdated,
  size = "sm",
  className,
}: ResolutionPickerButtonProps) => {
  const { busy, trigger } = useDownloadWallpaper({
    wallpaperId,
    slug,
    downloadCount,
    onUpdated,
  });

  const originalMeta = [
    width && height ? `${width}x${height}` : null,
    format ? format.toUpperCase() : null,
    fileSize ? formatBytes(fileSize) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const choices: { label: string; url: string; variant: DownloadVariant }[] = [
    urls.thumb400Url ?
      { label: "Small (400px WebP)", url: urls.thumb400Url, variant: "400" }
    : null,
    urls.thumb800Url ?
      { label: "Medium (800px WebP)", url: urls.thumb800Url, variant: "800" }
    : null,
    urls.thumb1920Url ?
      {
        label: "Large (1920px WebP)",
        url: urls.thumb1920Url,
        variant: "1920",
      }
    : null,
    urls.originalUrl ?
      {
        label: originalMeta ? `Original (${originalMeta})` : "Original file",
        url: urls.originalUrl,
        variant: "original",
      }
    : null,
  ].filter((choice) => choice !== null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "default", size, className })}
        disabled={busy || choices.length === 0}>
        {busy ?
          <Loader2Icon
            data-icon="inline-start"
            className="size-4 animate-spin"
          />
        : <DownloadIcon
            data-icon="inline-start"
            className="size-4"
          />
        }
        Download
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Choose resolution</DropdownMenuLabel>
          {choices.map((choice) => (
            <DropdownMenuItem
              key={choice.variant}
              onClick={() => void trigger(choice.url, choice.variant)}>
              {choice.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ResolutionPickerButton;
