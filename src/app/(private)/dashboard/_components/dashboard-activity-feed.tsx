import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import {
  CheckCircle2Icon,
  HeartIcon,
  HistoryIcon,
  ImagePlusIcon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const FEED_TAKE = 12;

type FeedEvent = {
  id: string;
  kind: "upload" | "approved" | "rejected" | "favorite" | "follow";
  text: string;
  note: string | null;
  href: Route<string> | null;
  date: Date;
};

const eventIcon = {
  upload: ImagePlusIcon,
  approved: CheckCircle2Icon,
  rejected: XCircleIcon,
  favorite: HeartIcon,
  follow: UserPlusIcon,
} as const;

const DashboardActivityFeed = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;
  const [uploads, decisions, favorites, following, followers] =
    await Promise.all([
      prisma.wallpaper.findMany({
        where: { uploaderId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, title: true, slug: true, createdAt: true },
      }),
      prisma.moderationQueue.findMany({
        where: {
          wallpaper: { uploaderId: userId },
          status: { not: "PENDING" },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          reviewNotes: true,
          updatedAt: true,
          wallpaper: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          createdAt: true,
          wallpaper: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { createdAt: true, following: { select: { name: true } } },
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { createdAt: true, follower: { select: { name: true } } },
      }),
    ]);

  const previewHref = (slug: string) => `/browse?preview=${slug}` as Route;

  const events: FeedEvent[] = [
    ...uploads.map((row): FeedEvent => ({
      id: `upload-${row.id}`,
      kind: "upload",
      text: `You uploaded ${row.title}`,
      note: null,
      href: previewHref(row.slug),
      date: row.createdAt,
    })),
    ...decisions.map((row): FeedEvent => ({
      id: `moderation-${row.id}`,
      kind: row.status === "APPROVED" ? "approved" : "rejected",
      text:
        row.status === "APPROVED" ?
          `${row.wallpaper.title} passed review`
        : `${row.wallpaper.title} was rejected`,
      note: row.reviewNotes,
      href: previewHref(row.wallpaper.slug),
      date: row.updatedAt,
    })),
    ...favorites.map((row): FeedEvent => ({
      id: `favorite-${row.wallpaper.id}`,
      kind: "favorite",
      text: `You favorited ${row.wallpaper.title}`,
      note: null,
      href: previewHref(row.wallpaper.slug),
      date: row.createdAt,
    })),
    ...following.map((row): FeedEvent => ({
      id: `follow-${row.following.name}-${row.createdAt.toISOString()}`,
      kind: "follow",
      text: `You started following ${row.following.name}`,
      note: null,
      href: null,
      date: row.createdAt,
    })),
    ...followers.map((row): FeedEvent => ({
      id: `followed-${row.follower.name}-${row.createdAt.toISOString()}`,
      kind: "follow",
      text: `${row.follower.name} started following you`,
      note: null,
      href: null,
      date: row.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const visible = events.slice(0, FEED_TAKE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Your uploads, moderation outcomes, favorites, and follows in one feed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <HistoryIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              No recent activity yet. Upload a wallpaper to get things going.
            </p>
          </div>
        : <ol className="grid gap-1">
            {visible.map((event) => {
              const Icon = eventIcon[event.kind];
              const body = (
                <>
                  <span className="bg-muted/60 text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-sm">{event.text}</span>
                    {event.note ?
                      <span className="text-muted-foreground truncate text-[11px] italic">
                        {event.note}
                      </span>
                    : null}
                  </span>
                  <time
                    suppressHydrationWarning={true}
                    dateTime={event.date.toISOString()}
                    className="text-muted-foreground shrink-0 text-[11px]">
                    {formatDistanceToNow(event.date, { addSuffix: true })}
                  </time>
                </>
              );
              return (
                <li key={event.id}>
                  {event.href ?
                    <Link
                      href={event.href}
                      className="hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl p-2 transition-colors focus-visible:ring-[3px]">
                      {body}
                    </Link>
                  : <div className="flex items-center gap-3 p-2">{body}</div>}
                </li>
              );
            })}
          </ol>
        }
      </CardContent>
    </Card>
  );
};

export default DashboardActivityFeed;
