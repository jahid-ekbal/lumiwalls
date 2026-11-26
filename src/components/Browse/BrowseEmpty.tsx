"use client";

import EmptyState from "@/components/UI/EmptyState";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import { EraserIcon, ImageOffIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useBrowseFilterParams } from "./useBrowseFilters";

type BrowseEmptyProps = {
  filtered: boolean;
};

const BrowseEmpty = ({ filtered }: BrowseEmptyProps) => {
  const { clearAll, hasFilters } = useBrowseFilterParams();

  return (
    <EmptyState
      icon={ImageOffIcon}
      title={filtered ? "No results match your filters" : "The gallery is empty"}
      description={
        filtered ?
          "Try removing one or more active filters to explore more approved wallpapers."
        : "No approved public wallpapers yet. Be the first to share one."
      }
      action={
        filtered ?
          <Button
            type="button"
            variant="outline"
            disabled={!hasFilters}
            onClick={clearAll}>
            <EraserIcon data-icon="inline-start" />
            Clear all filters
          </Button>
        : <Link
            href="/upload/new"
            className={buttonVariants({ variant: "secondary" })}>
            <UploadIcon data-icon="inline-start" />
            Upload a wallpaper
          </Link>
      }
    />
  );
};

export default BrowseEmpty;
