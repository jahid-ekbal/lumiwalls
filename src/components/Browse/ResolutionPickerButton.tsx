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
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { useDownloadWallpaper } from "./useDownloadWallpaper";

export type WallpaperUrlSet = {
  thumb400Url: string | null;
  thumb800Url: string | null;
  thumb1920Url: string | null;
  originalUrl: string | null;
};

type ResolutionPickerButtonProps = {
  wallpaperId: string;
  urls: WallpaperUrlSet;
  downloadCount: number;
  onUpdated?: (downloadCount: number | null) => void;
};

const ResolutionPickerButton = ({
  wallpaperId,
  urls,
  downloadCount,
  onUpdated,
}: ResolutionPickerButtonProps) => {
  const { busy, trigger } = useDownloadWallpaper({
    wallpaperId,
    downloadCount,
    onUpdated,
  });

  const choices = [
    urls.thumb400Url ?
      { label: "Small, 400px wide", url: urls.thumb400Url }
    : null,
    urls.thumb800Url ?
      { label: "Medium, 800px wide", url: urls.thumb800Url }
    : null,
    urls.thumb1920Url ?
      { label: "Large, 1920px wide", url: urls.thumb1920Url }
    : null,
    urls.originalUrl ? { label: "Original", url: urls.originalUrl } : null,
  ].filter((choice) => choice !== null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "default", size: "sm" })}
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
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Choose resolution</DropdownMenuLabel>
          {choices.map((choice) => (
            <DropdownMenuItem
              key={choice.label}
              onClick={() => void trigger(choice.url)}>
              {choice.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ResolutionPickerButton;
