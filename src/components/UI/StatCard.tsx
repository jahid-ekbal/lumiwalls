import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  href?: Route;
  className?: string;
};

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: StatCardProps) => {
  const formattedValue =
    typeof value === "number" ? formatCount(value) : value;

  const content = (
    <Card
      size="sm"
      className={cn(
        "h-full gap-2.5 transition-colors",
        href && "hover:ring-foreground/20 focus-within:ring-ring",
        className,
      )}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-caption text-muted-foreground font-medium tracking-wide uppercase">
          {label}
        </CardTitle>
        {Icon ?
          <Icon
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0"
          />
        : null}
      </CardHeader>
      <CardContent className="grid gap-1">
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {formattedValue}
        </p>
        {hint ?
          <p className="text-caption text-muted-foreground truncate">{hint}</p>
        : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:ring-ring/50 block rounded-surface outline-none focus-visible:ring-3">
        {content}
      </Link>
    );
  }

  return content;
};

export default StatCard;
