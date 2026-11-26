import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStateProps = {
  title: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
};

const ErrorState = ({
  title,
  description,
  digest,
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) => {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-card/50 flex flex-col items-start gap-4 rounded-surface border p-6",
        className,
      )}>
      <div className="flex items-start gap-3">
        <span className="bg-destructive/15 text-destructive flex size-10 shrink-0 items-center justify-center rounded-full">
          <AlertTriangleIcon
            aria-hidden="true"
            className="size-5"
          />
        </span>
        <div className="grid gap-1">
          <h2 className="font-heading text-h3 font-medium text-foreground">
            {title}
          </h2>
          {description ?
            <p className="text-body-sm text-muted-foreground text-pretty">
              {description}
            </p>
          : null}
          {digest ?
            <p className="text-caption text-muted-foreground/80 pt-0.5 font-mono">
              Reference: {digest}
            </p>
          : null}
        </div>
      </div>
      {onRetry || action ?
        <div className="flex flex-wrap items-center gap-2">
          {onRetry ?
            <Button
              type="button"
              onClick={onRetry}>
              <RotateCcwIcon data-icon="inline-start" />
              {retryLabel}
            </Button>
          : null}
          {action}
        </div>
      : null}
    </div>
  );
};

export default ErrorState;
