import { Button, buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type BasePaginationProps = {
  page: number;
  totalPages: number;
  className?: string;
};

type ButtonPaginationProps = BasePaginationProps & {
  onPageChange: (page: number) => void;
  buildHref?: never;
};

type LinkPaginationProps = BasePaginationProps & {
  buildHref: (page: number) => Route;
  onPageChange?: never;
};

type PaginationProps = ButtonPaginationProps | LinkPaginationProps;

const Pagination = ({
  page,
  totalPages,
  className,
  ...props
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3 pt-4", className)}>
      {"buildHref" in props && props.buildHref ?
        <>
          <Link
            href={props.buildHref(prevPage)}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              isFirst && "pointer-events-none opacity-50",
            )}>
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Link>
          <span className="text-caption text-muted-foreground tabular-nums">
            {`Page ${page} of ${totalPages}`}
          </span>
          <Link
            href={props.buildHref(nextPage)}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              isLast && "pointer-events-none opacity-50",
            )}>
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Link>
        </>
      : <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => props.onPageChange(prevPage)}>
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Button>
          <span className="text-caption text-muted-foreground tabular-nums">
            {`Page ${page} of ${totalPages}`}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLast}
            onClick={() => props.onPageChange(nextPage)}>
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </>
      }
    </nav>
  );
};

export default Pagination;
