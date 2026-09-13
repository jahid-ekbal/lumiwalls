"use client";

import { Button } from "@/components/shadcnui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { browseParsers } from "./browse-search-params";

type BrowsePaginationProps = {
  page: number;
  totalPages: number;
};

const visiblePages = (current: number, total: number): (number | "gap")[] => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const output: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    output.push(sorted[i]);
    const next = sorted[i + 1];
    if (typeof next === "number" && next - sorted[i] > 1) {
      output.push("gap");
    }
  }
  return output;
};

const scrollToResults = () => {
  document.getElementById("browse-results")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const BrowsePagination = ({ page, totalPages }: BrowsePaginationProps) => {
  const [, setPage] = useQueryState("page", browseParsers.page);

  if (totalPages <= 1) {
    return null;
  }

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped === page) {
      return;
    }
    void setPage(clamped);
    scrollToResults();
  };

  return (
    <nav
      aria-label="Browse pages"
      className="flex flex-wrap items-center justify-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        aria-label="Previous page">
        <ChevronLeftIcon className="size-4" />
        Prev
      </Button>
      {visiblePages(page, totalPages).map((entry, index) =>
        entry === "gap" ?
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="text-muted-foreground px-1 text-sm">
            ...
          </span>
        : <Button
            key={entry}
            type="button"
            variant={entry === page ? "default" : "ghost"}
            size="sm"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => goTo(entry)}>
            {entry}
          </Button>,
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        aria-label="Next page">
        Next
        <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  );
};

export default BrowsePagination;
