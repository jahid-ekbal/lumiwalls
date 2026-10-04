import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
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
  BookmarkIcon,
  DownloadIcon,
  EyeIcon,
  HeartIcon,
  ImagesIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";

const DashboardStats = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  const [totalWallpapers, pendingWallpapers, viewAggregate, downloadAggregate] =
    await Promise.all([
      prisma.wallpaper.count({ where: { uploaderId: userId } }),
      prisma.wallpaper.count({
        where: { uploaderId: userId, isApproved: false },
      }),
      prisma.wallpaper.aggregate({
        where: { uploaderId: userId },
        _sum: { viewCount: true },
      }),
      prisma.wallpaper.aggregate({
        where: { uploaderId: userId },
        _sum: { downloadCount: true },
      }),
    ]);

  const stats = [
    {
      title: "Total Wallpapers",
      value: totalWallpapers.toLocaleString(),
      description: "Wallpapers you uploaded",
      icon: ImagesIcon,
      href: "/browse" as Route,
      comingSoon: false,
    },
    {
      title: "Pending Approval",
      value: pendingWallpapers.toLocaleString(),
      description: "Awaiting moderation before Browse",
      icon: ImagesIcon,
      href: null,
      comingSoon: false,
    },
    {
      title: "Total Views",
      value: (viewAggregate._sum.viewCount ?? 0).toLocaleString(),
      description: "Sum across your uploads",
      icon: EyeIcon,
      href: null,
      comingSoon: false,
    },
    {
      title: "Total Downloads",
      value: (downloadAggregate._sum.downloadCount ?? 0).toLocaleString(),
      description: "Sum across your uploads",
      icon: DownloadIcon,
      href: null,
      comingSoon: false,
    },
    {
      title: "Total Comments",
      value: "-",
      description: "Comments are planned",
      icon: MessageSquareIcon,
      href: null,
      comingSoon: true,
    },
    {
      title: "Liked Wallpapers",
      value: "-",
      description: "Likes are planned",
      icon: HeartIcon,
      href: null,
      comingSoon: true,
    },
    {
      title: "Saved Wallpapers",
      value: "-",
      description: "Saved collections are planned",
      icon: BookmarkIcon,
      href: null,
      comingSoon: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const card = (
          <Card
            className={
              stat.href ? "hover:bg-muted/40 transition-colors" : undefined
            }>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{stat.title}</CardTitle>
                <stat.icon className="text-muted-foreground size-4" />
              </div>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                {stat.comingSoon && (
                  <Badge variant="secondary">Coming soon</Badge>
                )}
              </div>
              {stat.href && (
                <span
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "mt-2 px-0",
                  })}>
                  <span>View in browse</span>
                </span>
              )}
            </CardContent>
          </Card>
        );

        if (stat.href) {
          return (
            <Link
              key={stat.title}
              href={stat.href}
              aria-label={`${stat.title}: ${stat.description}`}
              className="block rounded-4xl">
              {card}
            </Link>
          );
        }

        return <div key={stat.title}>{card}</div>;
      })}
    </div>
  );
};

export default DashboardStats;
