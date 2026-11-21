import { buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import type { UploadStatusFilterType } from "@/lib/zodSchema";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type UploadPaginationProps = {
  page: number;
  totalPages: number;
  status: UploadStatusFilterType;
};

const buildHref = (page: number, status: UploadStatusFilterType) => {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return (query ? `/upload?${query}` : "/upload") as Route;
};

const UploadPagination = ({
  page,
  totalPages,
  status,
}: UploadPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <Link
        href={buildHref(Math.max(1, page - 1), status)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}>
        <ChevronLeftIcon
          data-icon="inline-start"
          className="size-4"
        />
        Previous
      </Link>
      <span className="text-muted-foreground text-sm">
        {`Page ${page} of ${totalPages}`}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1), status)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}>
        Next
        <ChevronRightIcon
          data-icon="inline-end"
          className="size-4"
        />
      </Link>
    </div>
  );
};

export default UploadPagination;
