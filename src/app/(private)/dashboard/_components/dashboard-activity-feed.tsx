import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2Icon,
  HeartIcon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type ActivityItem = {
  id: string;
  kind: "upload" | "approved" | "rejected" | "favorite";
  title: string;
  href: Route;
  at: Date;
};

const ACTIVITY_META = {
  upload: {
    label: "You uploaded",
    icon: UploadIcon,
  },
  approved: {
    label: "Approved in moderation",
    icon: CheckCircle2Icon,
  },
  rejected: {
    label: "Rejected in moderation",
    icon: XCircleIcon,
  },
  favorite: {
    label: "You favorited",
    icon: HeartIcon,
  },
} as const;

const DashboardActivityFeed = async () => {
  const session = await getActiveSession();

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  const [uploads, decisions, favorites] = await Promise.all([
    prisma.wallpaper.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        isApproved: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    prisma.moderationQueue.findMany({
      where: {
        wallpaper: { uploaderId: userId },
        reviewedAt: { not: null },
        status: { in: ["APPROVED", "REJECTED"] },
      },
      orderBy: { reviewedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        wallpaper: {
          select: {
            id: true,
            title: true,
            slug: true,
            isApproved: true,
            isPublic: true,
          },
        },
      },
    }),
    prisma.favorite.findMany({
      where: {
        userId,
        wallpaper: { isApproved: true, isPublic: true },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        wallpaperId: true,
        createdAt: true,
        wallpaper: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...uploads.map((row) => ({
      id: `upload-${row.id}`,
      kind: "upload" as const,
      title: row.title,
      href: (row.isApproved && row.isPublic ?
        `/browse?preview=${row.slug}`
      : `/upload/${row.id}/edit`) as Route,
      at: row.createdAt,
    })),
    ...decisions
      .filter((row) => row.reviewedAt !== null)
      .map((row) => ({
        id: `decision-${row.id}`,
        kind: (row.status === "APPROVED" ? "approved" : "rejected") as
          "approved" | "rejected",
        title: row.wallpaper.title,
        href: (row.wallpaper.isApproved && row.wallpaper.isPublic ?
          `/browse?preview=${row.wallpaper.slug}`
        : `/upload/${row.wallpaper.id}/edit`) as Route,
        at: row.reviewedAt!,
      })),
    ...favorites.map((row) => ({
      id: `fav-${row.wallpaperId}`,
      kind: "favorite" as const,
      title: row.wallpaper.title,
      href: `/browse?preview=${row.wallpaper.slug}` as Route,
      at: row.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 7);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Your uploads, moderation updates, and saved wallpapers
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ?
          <p className="text-body-sm text-muted-foreground py-6 text-center">
            No activity yet. Upload or save a wallpaper to get started.
          </p>
        : <ul className="grid gap-2">
            {items.map((item) => {
              const meta = ACTIVITY_META[item.kind];
              const Icon = meta.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl p-2 transition-colors outline-none focus-visible:ring-2">
                    <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Icon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-body-sm block truncate">
                        <span className="text-muted-foreground">
                          {meta.label}:{" "}
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </span>
                      <span className="text-caption text-muted-foreground block">
                        {formatDistanceToNow(item.at, { addSuffix: true })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardActivityFeed;
