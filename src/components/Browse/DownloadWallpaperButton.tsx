"use client";

import { Button, buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";
import { useDownloadWallpaper } from "./useDownloadWallpaper";

type DownloadWallpaperButtonProps = {
  wallpaperId: string;
  downloadUrl: string | null;
  downloadCount: number;
  onUpdated?: (downloadCount: number | null) => void;
  variant?: "ghost" | "default" | "outline" | "secondary";
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
};

const DownloadWallpaperButton = ({
  wallpaperId,
  downloadUrl,
  downloadCount,
  onUpdated,
  variant = "ghost",
  size = "sm",
  className,
}: DownloadWallpaperButtonProps) => {
  const { busy, trigger } = useDownloadWallpaper({
    wallpaperId,
    downloadCount,
    onUpdated,
  });

  if (!downloadUrl) {
    if (variant === "ghost") {
      return null;
    }
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={true}>
        No file available
      </Button>
    );
  }

  return (
    <a
      href={downloadUrl}
      download={true}
      rel="noreferrer"
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        void trigger(downloadUrl);
      }}
      aria-disabled={busy}
      className={cn(
        buttonVariants({ variant, size }),
        busy && "pointer-events-none opacity-50",
        className,
      )}>
      <DownloadIcon
        data-icon="inline-start"
        className="size-4"
      />
      Download
    </a>
  );
};

export default DownloadWallpaperButton;
