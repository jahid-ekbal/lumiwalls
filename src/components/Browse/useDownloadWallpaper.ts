"use client";

import { incrementDownloadCount } from "@/server/actions/browse";
import { toImagePath } from "@/lib/imageUrl";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

type UseDownloadWallpaperArgs = {
  wallpaperId: string;
  downloadCount: number;
  onUpdated?: (downloadCount: number | null) => void;
};

export function useDownloadWallpaper({
  wallpaperId,
  downloadCount,
  onUpdated,
}: UseDownloadWallpaperArgs) {
  const [busy, setBusy] = useState(false);

  const trigger = useCallback(
    async (url: string) => {
      if (busy) {
        return;
      }
      setBusy(true);
      onUpdated?.(downloadCount + 1);
      try {
        const anchor = document.createElement("a");
        anchor.href = toImagePath(url) ?? url;
        anchor.download = "";
        anchor.rel = "noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        try {
          const result = await incrementDownloadCount({ wallpaperId });
          if (result.success) {
            onUpdated?.(result.downloadCount);
          } else {
            onUpdated?.(null);
            toast.error("Download failed, please try again");
          }
        } catch {
          onUpdated?.(null);
          toast.error("Download failed, please try again");
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, downloadCount, onUpdated, wallpaperId],
  );

  return { busy, trigger };
}
