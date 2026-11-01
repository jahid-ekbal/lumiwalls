import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import prisma from "@/lib/database/dbClient";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FlagIcon, ShieldIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

const openReviewCta = (
  label: string,
  href: Route<string>,
  icon: typeof ShieldIcon,
) => {
  const Icon = icon;
  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "outline", size: "sm" })}>
      <Icon
        data-icon="inline-start"
        className="size-4"
      />
      <span>{label}</span>
    </Link>
  );
};

const DashboardModeration = async () => {
  const [pendingCount, oldestPending, pendingReportCount, latestPendingReport] =
    await Promise.all([
      prisma.moderationQueue.count({ where: { status: "PENDING" } }),
      prisma.moderationQueue.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: { reason: true, createdAt: true },
      }),
    ]);

  const hasQueueBacklog = pendingCount > 0;
  const hasReportBacklog = pendingReportCount > 0;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card
        className={cn(
          hasQueueBacklog && "ring-destructive/20 dark:ring-destructive/30",
        )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <ShieldIcon className="size-4" />
            </span>
            <div className="grid gap-0.5">
              <CardTitle>Moderation queue</CardTitle>
              <CardDescription>
                Uploads waiting for a review decision
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p
              className={cn(
                "text-3xl font-semibold tracking-tight",
                hasQueueBacklog && "text-destructive",
              )}>
              {pendingCount.toLocaleString()}
            </p>
            {openReviewCta(
              "Open moderation",
              "/admin/moderation" as Route,
              ShieldIcon,
            )}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {hasQueueBacklog && oldestPending ?
              `Oldest upload has been waiting ${formatDistanceToNow(
                oldestPending.createdAt,
              )}`
            : "The queue is caught up. Nothing is waiting."}
          </p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          hasReportBacklog && "ring-destructive/20 dark:ring-destructive/30",
        )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <FlagIcon className="size-4" />
            </span>
            <div className="grid gap-0.5">
              <CardTitle>User reports</CardTitle>
              <CardDescription>
                Flags filed against wallpapers, unresolved
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p
              className={cn(
                "text-3xl font-semibold tracking-tight",
                hasReportBacklog && "text-destructive",
              )}>
              {pendingReportCount.toLocaleString()}
            </p>
            {openReviewCta(
              "Review reports",
              "/admin/reports" as Route,
              FlagIcon,
            )}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {hasReportBacklog && latestPendingReport ?
              `Most recent: ${latestPendingReport.reason.toLowerCase()}, filed ${formatDistanceToNow(
                latestPendingReport.createdAt,
                { addSuffix: true },
              )}`
            : "No open reports. All flags are resolved or dismissed."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardModeration;
