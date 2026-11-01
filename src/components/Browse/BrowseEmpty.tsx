"use client";

import { buttonVariants, Button } from "@/components/shadcnui/button";
import Link from "next/link";
import { useBrowseFilterParams } from "./useBrowseFilters";
import { cn } from "@/lib/utils";
import { EraserIcon, ImageOffIcon, UploadIcon } from "lucide-react";

type BrowseEmptyProps = {
  filtered: boolean;
};

const BrowseEmpty = ({ filtered }: BrowseEmptyProps) => {
  const { clearAll, hasFilters } = useBrowseFilterParams();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border px-6 py-20 text-center">
      <span className="bg-card flex size-16 items-center justify-center rounded-full border shadow-lg shadow-black/20">
        <ImageOffIcon className="text-muted-foreground size-6" />
      </span>
      <div className="grid gap-1">
        <h2 className="font-heading text-lg font-semibold">
          {filtered ? "No results match your filters" : "The gallery is empty"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {filtered ?
            "Try removing some filters to see more wallpapers."
          : "No approved public wallpapers yet. Be the first to upload one."}
        </p>
      </div>
      {filtered ?
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={clearAll}>
          <EraserIcon
            data-icon="inline-start"
            className="size-4"
          />
          Clear all filters
        </Button>
      : <Link
          href="/upload"
          className={cn(buttonVariants({ variant: "secondary" }))}>
          <UploadIcon
            data-icon="inline-start"
            className="size-4"
          />
          Upload a wallpaper
        </Link>
      }
    </div>
  );
};

export default BrowseEmpty;
