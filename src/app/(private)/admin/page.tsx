import AdminTrendChart, {
  type TrendPoint,
} from "@/components/Admin/AdminTrendChart";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import {
  ArrowRightIcon,
  BarChart3Icon,
  DownloadIcon,
  EyeIcon,
  FlagIcon,
  FolderOpenIcon,
  HourglassIcon,
  ImagesIcon,
  ShieldIcon,
  SparklesIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Admin dashboard overview on Lumiwalls",
});

const TREND_DAYS = 30;
const PREVIEW_TAKE = 5;

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

const buildTrend = (
  wallpaperDates: Date[],
  userDates: Date[],
  now: Date,
): TrendPoint[] => {
  const buckets = new Map<string, { wallpapers: number; users: number }>();

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - i);
    buckets.set(toDayKey(day), { wallpapers: 0, users: 0 });
  }

  for (const date of wallpaperDates) {
    const bucket = buckets.get(toDayKey(date));
    if (bucket) {
      bucket.wallpapers += 1;
    }
  }

  for (const date of userDates) {
    const bucket = buckets.get(toDayKey(date));
    if (bucket) {
      bucket.users += 1;
    }
  }

  return [...buckets.entries()].map(([date, counts]) => ({
    date,
    label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    ...counts,
  }));
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const initials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const quickLinks = [
  {
    title: "Taxonomy",
    description: "Categories and tags",
    url: "/admin/taxonomy",
    icon: TagsIcon,
  },
  {
    title: "Moderation",
    description: "Review pending uploads",
    url: "/admin/moderation",
    icon: ShieldIcon,
  },
  {
    title: "Users",
    description: "Roles and bans",
    url: "/admin/users",
    icon: UsersIcon,
  },
  {
    title: "Reports",
    description: "User reports inbox",
    url: "/admin/reports",
    icon: FlagIcon,
  },
  {
    title: "Collections",
    description: "Curated sets",
    url: "/admin/collections",
    icon: FolderOpenIcon,
  },
  {
    title: "Featured",
    description: "Homepage picks",
    url: "/admin/featured",
    icon: SparklesIcon,
  },
  {
    title: "Analytics",
    description: "Traffic and growth",
    url: "/admin/analytics",
    icon: BarChart3Icon,
  },
];

const AdminDashboardPage = async () => {
  const now = new Date();
  const trendStart = new Date(now);
  trendStart.setUTCDate(now.getUTCDate() - (TREND_DAYS - 1));
  trendStart.setUTCHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalWallpapers,
    pendingCount,
    viewAggregate,
    downloadAggregate,
    categoryCount,
    tagCount,
    wallpaperCreatedDates,
    userCreatedDates,
    pendingQueue,
    recentWallpapers,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallpaper.count(),
    prisma.moderationQueue.count({ where: { status: "PENDING" } }),
    prisma.wallpaper.aggregate({ _sum: { viewCount: true } }),
    prisma.wallpaper.aggregate({ _sum: { downloadCount: true } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.wallpaper.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.moderationQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: PREVIEW_TAKE,
      include: {
        wallpaper: {
          include: {
            uploader: { select: { name: true, email: true } },
            category: { select: { name: true } },
            tags: {
              take: 3,
              include: { tag: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.wallpaper.findMany({
      orderBy: { createdAt: "desc" },
      take: PREVIEW_TAKE,
      include: {
        uploader: { select: { name: true, email: true } },
        category: { select: { name: true } },
        moderationQueue: { select: { status: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: PREVIEW_TAKE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
  ]);

  const trend = buildTrend(
    wallpaperCreatedDates.map((item) => item.createdAt),
    userCreatedDates.map((item) => item.createdAt),
    now,
  );

  const stats = [
    {
      title: "Total users",
      value: totalUsers.toLocaleString(),
      description: "Registered accounts",
      icon: UsersIcon,
    },
    {
      title: "Total wallpapers",
      value: totalWallpapers.toLocaleString(),
      description: "Uploaded wallpapers",
      icon: ImagesIcon,
    },
    {
      title: "Pending moderation",
      value: pendingCount.toLocaleString(),
      description: "Awaiting review",
      icon: HourglassIcon,
    },
    {
      title: "Lifetime views",
      value: (viewAggregate._sum.viewCount ?? 0).toLocaleString(),
      description: "Sum of wallpaper views",
      icon: EyeIcon,
    },
    {
      title: "Lifetime downloads",
      value: (downloadAggregate._sum.downloadCount ?? 0).toLocaleString(),
      description: "Sum of wallpaper downloads",
      icon: DownloadIcon,
    },
    {
      title: "Taxonomy",
      value: (categoryCount + tagCount).toLocaleString(),
      description: `${categoryCount} categories, ${tagCount} tags`,
      icon: TagsIcon,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Platform overview for the last {TREND_DAYS} days
            </p>
          </div>
          <Link
            href={"/admin/analytics" as Route}
            className={buttonVariants({ variant: "outline" })}>
            <span>View analytics</span>
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{stat.title}</CardTitle>
                  <stat.icon className="text-muted-foreground size-4" />
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <AdminTrendChart data={trend} />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Pending moderation</CardTitle>
                <CardDescription>
                  Oldest first by queue order, latest {PREVIEW_TAKE} shown
                </CardDescription>
              </div>
              <Link
                href={"/admin/moderation" as Route}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}>
                <span>Open moderation</span>
                <ArrowRightIcon />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingQueue.length === 0 ?
              <p className="text-muted-foreground py-8 text-center text-sm">
                No wallpapers awaiting review.
              </p>
            : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallpaper</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingQueue.map((item) => {
                    const wallpaper = item.wallpaper;
                    const thumb =
                      wallpaper.thumb400Url ??
                      wallpaper.thumb800Url ??
                      wallpaper.originalUrl;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumb ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt={wallpaper.title}
                                className="size-10 shrink-0 rounded-xl object-cover"
                                loading="lazy"
                              />
                            : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                            }
                            <div>
                              <p className="font-medium">{wallpaper.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {formatDate(item.createdAt)} in queue
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{wallpaper.uploader.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {wallpaper.uploader.email} on{" "}
                              {formatDate(wallpaper.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {wallpaper.category ?
                              <Badge variant="secondary">
                                {wallpaper.category.name}
                              </Badge>
                            : <span className="text-muted-foreground text-xs">
                                Uncategorized
                              </span>
                            }
                            {wallpaper.tags.map(({ tag }) => (
                              <Badge
                                key={tag.name}
                                variant="outline">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent wallpapers</CardTitle>
                  <CardDescription>
                    Latest {PREVIEW_TAKE} uploads
                  </CardDescription>
                </div>
                <Link
                  href={"/browse" as Route}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}>
                  <span>Browse all</span>
                  <ArrowRightIcon />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentWallpapers.length === 0 ?
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No wallpapers yet.
                </p>
              : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallpaper</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentWallpapers.map((wallpaper) => (
                      <TableRow key={wallpaper.id}>
                        <TableCell>
                          <p className="font-medium">{wallpaper.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {wallpaper.uploader.email} on{" "}
                            {formatDate(wallpaper.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={
                                wallpaper.isApproved ? "secondary" : "outline"
                              }>
                              {wallpaper.isApproved ? "Approved" : "Unapproved"}
                            </Badge>
                            {wallpaper.moderationQueue ?
                              <Badge variant="outline">
                                {wallpaper.moderationQueue.status}
                              </Badge>
                            : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent users</CardTitle>
                  <CardDescription>
                    Latest {PREVIEW_TAKE} accounts
                  </CardDescription>
                </div>
                <Link
                  href={"/admin/users" as Route}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}>
                  <span>Manage users</span>
                  <ArrowRightIcon />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ?
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No users yet.
                </p>
              : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              {user.image ?
                                <AvatarImage
                                  src={user.image}
                                  alt={user.name}
                                />
                              : null}
                              <AvatarFallback>
                                {initials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : "secondary"
                              }>
                              {user.role ?? "user"}
                            </Badge>
                            {user.banned ?
                              <Badge variant="destructive">Banned</Badge>
                            : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin sections</CardTitle>
            <CardDescription>Jump to each management area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.url}
                  href={link.url as Route}
                  className={buttonVariants({
                    variant: "outline",
                    className: "h-auto justify-start p-4",
                  })}>
                  <link.icon className="size-5 shrink-0" />
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">{link.title}</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {link.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
