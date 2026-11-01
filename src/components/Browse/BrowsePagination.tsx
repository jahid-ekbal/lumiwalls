"use client";

import { buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { browseParsers } from "./browse-search-params";

type BrowsePaginationProps = {
  page: number;
  totalPages: number;
};

const BrowsePagination = ({
  page,
  totalPages,
}: BrowsePaginationProps) => {
  const [, setPage] = useQueryState("page", browseParsers.page);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => void setPage(Math.max(1, page - 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "cursor-pointer",
          page <= 1 && "opacity-50 pointer-events-none",
        )}>
        <ChevronLeftIcon data-icon="inline-start" className="size-4" />
        Previous
      </button>
      <span className="text-muted-foreground text-sm">
        {`Page ${page} of ${totalPages}`}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => void setPage(Math.min(totalPages, page + 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "cursor-pointer",
          page >= totalPages && "opacity-50 pointer-events-none",
        )}>
        Next
        <ChevronRightIcon data-icon="inline-end" className="size-4" />
      </button>
    </div>
  );
};

export default BrowsePagination;
