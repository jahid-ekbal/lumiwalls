import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { DownloadIcon, EyeIcon, HeartIcon, ImagesIcon } from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";

const DashboardStats = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  const [
    totalWallpapers,
    pendingWallpapers,
    viewAggregate,
    downloadAggregate,
    favoriteCount,
  ] = await Promise.all([
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
    prisma.favorite.count({ where: { userId } }),
  ]);

  const stats = [
    {
      title: "Total Wallpapers",
      value: totalWallpapers.toLocaleString(),
      description: "Wallpapers you uploaded",
      icon: ImagesIcon,
      href: "/browse" as Route,
    },
    {
      title: "Pending Approval",
      value: pendingWallpapers.toLocaleString(),
      description: "Awaiting moderation before Browse",
      icon: ImagesIcon,
      href: "/profile" as Route,
    },
    {
      title: "Total Views",
      value: (viewAggregate._sum.viewCount ?? 0).toLocaleString(),
      description: "Sum across your uploads",
      icon: EyeIcon,
      href: "/browse?sort=views" as Route,
    },
    {
      title: "Total Downloads",
      value: (downloadAggregate._sum.downloadCount ?? 0).toLocaleString(),
      description: "Sum across your uploads",
      icon: DownloadIcon,
      href: "/browse?sort=downloads" as Route,
    },
    {
      title: "Favorites",
      value: favoriteCount.toLocaleString(),
      description: "Wallpapers you saved",
      icon: HeartIcon,
      href: "/dashboard#favorites" as Route,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Link
          key={stat.title}
          href={stat.href}
          aria-label={`${stat.title}: ${stat.description}`}
          className="focus-visible:ring-ring/50 block h-full rounded-4xl focus-visible:ring-[3px]">
          <Card className="hover:bg-muted/40 h-full transition-colors">
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
        </Link>
      ))}
    </div>
  );
};

export default DashboardStats;
