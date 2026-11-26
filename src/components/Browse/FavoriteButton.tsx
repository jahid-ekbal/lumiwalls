"use client";

import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/server/actions/favorites";
import { HeartIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useGallerySync } from "./GallerySyncContext";

type FavoriteButtonProps = {
  wallpaperId: string;
  favorited: boolean;
  favoriteCount: number;
  onUpdated?: (favorited: boolean, favoriteCount: number) => void;
  size?: "xs" | "sm" | "default" | "icon-sm" | "icon-xs";
  variant?: "ghost" | "outline" | "secondary";
  iconOnly?: boolean;
  className?: string;
};

const FavoriteButton = ({
  wallpaperId,
  favorited,
  favoriteCount,
  onUpdated,
  size = "sm",
  variant = "ghost",
  iconOnly = false,
  className,
}: FavoriteButtonProps) => {
  const sync = useGallerySync();
  const [overlay, setOverlay] = useState<{
    favorited: boolean;
    favoriteCount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const syncedState = sync?.getState({
    id: wallpaperId,
    favoritedByMe: favorited,
    favoriteCount,
    downloadCount: 0,
  } as never);

  const current = overlay ??
    (syncedState ?
      {
        favorited: syncedState.favorited,
        favoriteCount: syncedState.favoriteCount,
      }
    : { favorited, favoriteCount });

  const handleToggle = async () => {
    if (busy) {
      return;
    }
    const next = {
      favorited: !current.favorited,
      favoriteCount: Math.max(
        0,
        current.favoriteCount + (current.favorited ? -1 : 1),
      ),
    };
    setOverlay(next);
    sync?.setFavoriteState(wallpaperId, next.favorited, next.favoriteCount);
    setBusy(true);
    try {
      const result = await toggleFavorite({ wallpaperId });
      if (result.success) {
        const confirmed = {
          favorited: result.favorited,
          favoriteCount: result.favoriteCount,
        };
        setOverlay(confirmed);
        sync?.setFavoriteState(
          wallpaperId,
          confirmed.favorited,
          confirmed.favoriteCount,
        );
        onUpdated?.(confirmed.favorited, confirmed.favoriteCount);
      } else {
        setOverlay(null);
        sync?.setFavoriteState(
          wallpaperId,
          current.favorited,
          current.favoriteCount,
        );
        toast.error(
          result.error === "NOT_FOUND" ?
            "Wallpaper is unavailable"
          : "Could not update favorite",
        );
      }
    } catch {
      setOverlay(null);
      sync?.setFavoriteState(
        wallpaperId,
        current.favorited,
        current.favoriteCount,
      );
      toast.error("Could not update favorite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      aria-pressed={current.favorited}
      aria-label={
        iconOnly ?
          current.favorited ? "Remove from favorites" : "Add to favorites"
        : undefined
      }
      className={cn(
        current.favorited &&
          "text-rose-500 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-400",
        className,
      )}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        void handleToggle();
      }}>
      <HeartIcon
        data-icon={iconOnly ? undefined : "inline-start"}
        className={cn(current.favorited && "fill-current")}
      />
      {iconOnly ? null : current.favorited ? "Favorited" : "Favorite"}
    </Button>
  );
};

export default FavoriteButton;
