import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/30 flex flex-col items-center justify-center rounded-surface border text-center",
        compact ? "gap-2.5 px-5 py-8" : "gap-3.5 px-6 py-12",
        className,
      )}>
      {Icon ?
        <span className="bg-muted/80 text-muted-foreground ring-border/60 flex size-11 items-center justify-center rounded-full ring-1">
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </span>
      : null}
      <div className="grid max-w-md gap-1">
        <h3 className="font-heading text-h3 font-medium text-foreground">
          {title}
        </h3>
        {description ?
          <p className="text-body-sm text-muted-foreground text-pretty">
            {description}
          </p>
        : null}
      </div>
      {action ?
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
        </div>
      : null}
    </div>
  );
};

export default EmptyState;
