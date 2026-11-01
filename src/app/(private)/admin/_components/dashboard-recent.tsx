import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import prisma from "@/lib/database/dbClient";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRightIcon,
  FlagIcon,
  HourglassIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";

const WATCH_TAKE = 4;
const WATCH_VISIBLE = 10;
const WATCH_WINDOW_DAYS = 2;

type WatchBadgeVariant = "outline" | "destructive" | "secondary";

type WatchItem = {
  key: string;
  at: Date;
  icon: LucideIcon;
  title: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: WatchBadgeVariant;
  href: Route<string> | null;
};

const DashboardRecent = async () => {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - WATCH_WINDOW_DAYS);

  const [signups, reports, pendingUploads] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
      take: WATCH_TAKE,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.report.findMany({
      where: { createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
      take: WATCH_TAKE,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        wallpaper: { select: { title: true } },
      },
    }),
    prisma.wallpaper.findMany({
      where: { moderationQueue: { is: { status: "PENDING" } } },
      orderBy: { createdAt: "desc" },
      take: WATCH_TAKE,
      select: {
        id: true,
        title: true,
        createdAt: true,
        uploader: { select: { email: true } },
      },
    }),
  ]);

  const items: WatchItem[] = [];

  for (const signup of signups) {
    items.push({
      key: `signup-${signup.id}`,
      at: signup.createdAt,
      icon: UserPlusIcon,
      title: signup.name,
      detail: `${signup.email} joined ${formatDistanceToNow(signup.createdAt, {
        addSuffix: true,
      })}`,
      badgeLabel: "New account",
      badgeVariant: "outline",
      href: `/admin/users/${signup.id}` as Route,
    });
  }

  for (const report of reports) {
    items.push({
      key: `report-${report.id}`,
      at: report.createdAt,
      icon: FlagIcon,
      title: report.wallpaper.title,
      detail: `${report.reason.toLowerCase()}, filed ${formatDistanceToNow(
        report.createdAt,
        { addSuffix: true },
      )}`,
      badgeLabel: report.status === "PENDING" ? "Open report" : "Handled",
      badgeVariant: report.status === "PENDING" ? "destructive" : "outline",
      href: null,
    });
  }

  for (const upload of pendingUploads) {
    items.push({
      key: `upload-${upload.id}`,
      at: upload.createdAt,
      icon: HourglassIcon,
      title: upload.title,
      detail: `${upload.uploader.email} uploaded ${formatDistanceToNow(
        upload.createdAt,
        { addSuffix: true },
      )}`,
      badgeLabel: "Pending review",
      badgeVariant: "secondary",
      href: "/admin/moderation?status=PENDING" as Route,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  const visible = items.slice(0, WATCH_VISIBLE);

  const rowClass =
    "flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>
          Newest accounts, reports, and site wide uploads waiting in the last{" "}
          {WATCH_WINDOW_DAYS} days, plus the current review queue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ?
          <p className="text-muted-foreground py-8 text-center text-sm">
            Quiet lately. No new accounts, reports, or pending uploads.
          </p>
        : <ul className="divide-y">
            {visible.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {item.detail}
                    </p>
                  </div>
                  <Badge
                    variant={item.badgeVariant}
                    className="shrink-0 justify-center">
                    {item.badgeLabel}
                  </Badge>
                  {item.href ?
                    <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                  : null}
                </>
              );

              return (
                <li key={item.key}>
                  {item.href ?
                    <Link
                      href={item.href}
                      className={cn(rowClass, "hover:bg-muted/50 rounded-lg")}>
                      {content}
                    </Link>
                  : <div className={rowClass}>{content}</div>}
                </li>
              );
            })}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardRecent;
