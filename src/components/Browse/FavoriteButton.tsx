"use client";

import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/server/actions/favorites";
import { HeartIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type FavoriteButtonProps = {
  wallpaperId: string;
  favorited: boolean;
  favoriteCount: number;
  onUpdated?: (favorited: boolean, favoriteCount: number) => void;
  size?: "xs" | "sm" | "default";
};

const FavoriteButton = ({
  wallpaperId,
  favorited,
  favoriteCount,
  onUpdated,
  size = "sm",
}: FavoriteButtonProps) => {
  const [overlay, setOverlay] = useState<{
    favorited: boolean;
    favoriteCount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const current = overlay ?? { favorited, favoriteCount };

  const handleToggle = async () => {
    if (busy) {
      return;
    }
    const next = {
      favorited: !current.favorited,
      favoriteCount: current.favoriteCount + (current.favorited ? -1 : 1),
    };
    setOverlay(next);
    setBusy(true);
    try {
      const result = await toggleFavorite({ wallpaperId });
      if (result.success) {
        const synced = {
          favorited: result.favorited,
          favoriteCount: result.favoriteCount,
        };
        setOverlay(synced);
        onUpdated?.(synced.favorited, synced.favoriteCount);
      } else {
        setOverlay(null);
        toast.error(
          result.error === "NOT_FOUND" ?
            "Wallpaper is unavailable"
          : "Could not update favorite",
        );
      }
    } catch {
      setOverlay(null);
      toast.error("Could not update favorite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      disabled={busy}
      aria-pressed={current.favorited}
      className={cn(current.favorited && "text-rose-300 hover:text-rose-300")}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        void handleToggle();
      }}>
      <HeartIcon
        data-icon="inline-start"
        className={cn("size-4", current.favorited && "fill-current")}
      />
      {current.favorited ? "Favorited" : "Favorite"}
    </Button>
  );
};

export default FavoriteButton;
