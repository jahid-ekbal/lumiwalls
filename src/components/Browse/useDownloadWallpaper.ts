"use client";

import { incrementDownloadCount } from "@/server/actions/browse";
import { toImagePath } from "@/lib/imageUrl";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

export type DownloadVariant = "400" | "800" | "1920" | "original";

type UseDownloadWallpaperArgs = {
  wallpaperId: string;
  slug?: string;
  downloadCount: number;
  onUpdated?: (downloadCount: number | null) => void;
};

export function useDownloadWallpaper({
  wallpaperId,
  slug,
  downloadCount,
  onUpdated,
}: UseDownloadWallpaperArgs) {
  const [busy, setBusy] = useState(false);

  const trigger = useCallback(
    async (url: string, variant: DownloadVariant = "original") => {
      if (busy) {
        return;
      }
      setBusy(true);
      onUpdated?.(downloadCount + 1);
      try {
        const relativePath = toImagePath(url) ?? url;
        const separator = relativePath.includes("?") ? "&" : "?";
        const filenameBase = slug ? `${slug}-${variant}` : `lumiwalls-${variant}`;
        const downloadHref = `${relativePath}${separator}download=1&filename=${encodeURIComponent(filenameBase)}`;

        const anchor = document.createElement("a");
        anchor.href = downloadHref;
        anchor.download = filenameBase;
        anchor.rel = "noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        try {
          const result = await incrementDownloadCount({ wallpaperId, variant });
          if (result.success) {
            onUpdated?.(result.downloadCount);
          } else {
            onUpdated?.(null);
            toast.error("Could not record download");
          }
        } catch {
          onUpdated?.(null);
          toast.error("Could not record download");
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, downloadCount, onUpdated, slug, wallpaperId],
  );

  return { busy, trigger };
}
