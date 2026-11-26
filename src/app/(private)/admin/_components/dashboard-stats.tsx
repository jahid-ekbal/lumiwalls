import StatCard from "@/components/UI/StatCard";
import prisma from "@/lib/database/dbClient";
import {
  DownloadIcon,
  EyeIcon,
  HourglassIcon,
  ImagesIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";

const DashboardStats = async () => {
  const [
    totalUsers,
    totalWallpapers,
    pendingCount,
    viewAggregate,
    downloadAggregate,
    categoryCount,
    tagCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallpaper.count(),
    prisma.moderationQueue.count({ where: { status: "PENDING" } }),
    prisma.wallpaper.aggregate({ _sum: { viewCount: true } }),
    prisma.wallpaper.aggregate({ _sum: { downloadCount: true } }),
    prisma.category.count(),
    prisma.tag.count(),
  ]);

  const stats = [
    {
      label: "Total users",
      value: totalUsers,
      hint: "Registered accounts",
      icon: UsersIcon,
      href: "/admin/users" as const,
    },
    {
      label: "Total wallpapers",
      value: totalWallpapers,
      hint: "Uploaded wallpapers",
      icon: ImagesIcon,
      href: "/admin/moderation" as const,
    },
    {
      label: "Pending moderation",
      value: pendingCount,
      hint: "Awaiting review",
      icon: HourglassIcon,
      href: "/admin/moderation" as const,
    },
    {
      label: "Lifetime views",
      value: viewAggregate._sum.viewCount ?? 0,
      hint: "Sum of wallpaper views",
      icon: EyeIcon,
      href: "/admin/analytics" as const,
    },
    {
      label: "Lifetime downloads",
      value: downloadAggregate._sum.downloadCount ?? 0,
      hint: "Sum of wallpaper downloads",
      icon: DownloadIcon,
      href: "/admin/analytics" as const,
    },
    {
      label: "Taxonomy",
      value: categoryCount + tagCount,
      hint: `${categoryCount} categories, ${tagCount} tags`,
      icon: TagsIcon,
      href: "/admin/categories" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
