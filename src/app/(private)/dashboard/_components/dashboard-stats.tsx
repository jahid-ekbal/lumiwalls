import StatCard from "@/components/UI/StatCard";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import {
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  HeartIcon,
  ImagesIcon,
} from "lucide-react";
import type { Route } from "next";

const DashboardStats = async () => {
  const session = await getActiveSession();

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
    prisma.favorite.count({
      where: {
        userId,
        wallpaper: { isApproved: true, isPublic: true },
      },
    }),
  ]);

  const stats = [
    {
      label: "Total wallpapers",
      value: totalWallpapers,
      hint: "Wallpapers you uploaded",
      icon: ImagesIcon,
      href: "/upload" as Route,
    },
    {
      label: "Pending approval",
      value: pendingWallpapers,
      hint: "Awaiting moderation before Browse",
      icon: ClockIcon,
      href: "/upload?status=pending" as Route,
    },
    {
      label: "Total views",
      value: viewAggregate._sum.viewCount ?? 0,
      hint: "Sum across your uploads",
      icon: EyeIcon,
      href: "/browse?sort=views" as Route,
    },
    {
      label: "Total downloads",
      value: downloadAggregate._sum.downloadCount ?? 0,
      hint: "Sum across your uploads",
      icon: DownloadIcon,
      href: "/browse?sort=downloads" as Route,
    },
    {
      label: "Favorites",
      value: favoriteCount,
      hint: "Wallpapers you saved",
      icon: HeartIcon,
      href: "/profile?tab=favorites" as Route,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          icon={stat.icon}
          href={stat.href}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
