import { buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import type { UploadStatusFilterType } from "@/lib/zodSchema";
import type { Route } from "next";
import Link from "next/link";

const TABS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending review" },
  { value: "rejected", label: "Rejected" },
] as const;

type UploadStatusTabsProps = {
  active: UploadStatusFilterType;
  counts: Record<UploadStatusFilterType, number>;
};

const UploadStatusTabs = ({ active, counts }: UploadStatusTabsProps) => {
  return (
    <div className="border-border/60 bg-card/40 w-fit max-w-full overflow-x-auto rounded-4xl border p-1">
      <div className="flex gap-1">
        {TABS.map(({ value, label }) => {
          const isActive = value === active;
          const href = value === "all" ? "/upload" : `/upload?status=${value}`;

          return (
            <Link
              key={value}
              href={href as Route}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: isActive ? "default" : "ghost",
                  size: "sm",
                }),
                "gap-2 whitespace-nowrap",
              )}>
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  isActive ?
                    "bg-primary-foreground/15"
                  : "bg-muted text-muted-foreground",
                )}>
                {counts[value]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UploadStatusTabs;
