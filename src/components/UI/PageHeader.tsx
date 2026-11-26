import { buttonVariants } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: Route;
  backLabel?: string;
  className?: string;
};

const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}>
      <div className="grid min-w-0 gap-1.5">
        {backHref ?
          <div>
            <Link
              href={backHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "xs" }),
                "-ml-2 text-muted-foreground hover:text-foreground",
              )}>
              <ArrowLeftIcon data-icon="inline-start" />
              {backLabel}
            </Link>
          </div>
        : null}
        {eyebrow ?
          <p className="text-eyebrow text-muted-foreground font-medium uppercase">
            {eyebrow}
          </p>
        : null}
        <h1 className="font-heading text-h1 font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description ?
          <p className="text-body-sm text-muted-foreground max-w-2xl text-pretty">
            {description}
          </p>
        : null}
      </div>
      {actions ?
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      : null}
    </header>
  );
};

export default PageHeader;
